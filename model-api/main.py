import gc
import hashlib
import json
import os
import re
import secrets
import threading
import time
import uuid
from typing import Any

import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer


MODEL_SPECS = {
    "athenista/slm-tavenel-1m": ("77d1d8b09af0ff8583844460f383f8f1c4f9bd96", 1024, None),
    "athenista/slm-tavenel-10m": ("f763b6f39d21baf388f8e0cd10f324a13a7caec8", 1024, None),
    "athenista/slm-tavenel-25m": ("b0b5d762a500c8b14ccc9b7ddcddab6d5e49ec05", 1024, None),
    "athenista/slm-tavenel-25m-hplt-10pct": ("98904f24de85ddbc5c9c243a695e3afe79930589", 1024, None),
    "athenista/slm-tavenel-124m": ("877392873e7e46c0e5946d6e943ce4e90f71a49f", 2048, None),
    # Third-party TinyStories Llama2 model; HF files live under hf/.
    "shibatch/tiny1m": ("fdacad8ff9dc27bd72c77d3684075a494be1ba11", 256, "hf"),
}

# The VPS exposes CPU time but no hardware energy meter. These deliberately
# broad assumptions produce a workload-only estimate, not a measured bill.
CPU_WATTS_PER_CORE_RANGE = (10.0, 20.0)
FRANCE_GRID_GCO2E_PER_KWH = 20.0  # RTE 2025 average consumption intensity.

MODEL_API_KEY = os.environ.get("MODEL_API_KEY", "")
if not MODEL_API_KEY:
    raise RuntimeError("MODEL_API_KEY must be set")

torch.set_num_threads(max(1, int(os.environ.get("OMP_NUM_THREADS", "2"))))
app = FastAPI(title="SLM-Tavenel inference API", docs_url=None, redoc_url=None)
inference_lock = threading.Lock()
MAX_IN_FLIGHT_GENERATIONS = max(1, int(os.environ.get("MAX_IN_FLIGHT_GENERATIONS", "32")))
generation_slots = threading.BoundedSemaphore(MAX_IN_FLIGHT_GENERATIONS)
loaded_model_id: str | None = None
loaded_model: Any = None
loaded_tokenizer: Any = None
HOST_RESOURCE_LIMIT_PERCENT = min(
    90.0, max(1.0, float(os.environ.get("HOST_RESOURCE_LIMIT_PERCENT", "80")))
)
host_resource_lock = threading.Lock()
host_resource_usage = {"cpu_percent": 0.0, "memory_percent": 0.0}


class ChatMessage(BaseModel):
    role: str
    content: str = Field(max_length=4000)


class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)
    max_tokens: int = Field(default=192, ge=1, le=256)
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.9, gt=0, le=1)
    stream: bool = False


class PublicChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)
    max_tokens: int = Field(default=192, ge=1, le=256)
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.9, gt=0, le=1)


def require_api_key(authorization: str | None = Header(default=None)) -> None:
    scheme, _, value = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not secrets.compare_digest(value, MODEL_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API key")


def read_host_cpu_counters() -> tuple[int, int]:
    with open("/proc/stat", encoding="ascii") as stats:
        fields = stats.readline().split()[1:]
    values = [int(value) for value in fields[:8]]
    idle = values[3] + (values[4] if len(values) > 4 else 0)
    return sum(values), idle


def read_host_memory_percent() -> float:
    values: dict[str, int] = {}
    with open("/proc/meminfo", encoding="ascii") as meminfo:
        for line in meminfo:
            key, value = line.split(":", 1)
            if key in {"MemTotal", "MemAvailable"}:
                values[key] = int(value.strip().split()[0])
    return 100.0 * (values["MemTotal"] - values["MemAvailable"]) / values["MemTotal"]


def monitor_host_resources() -> None:
    previous_total, previous_idle = read_host_cpu_counters()
    while True:
        time.sleep(2)
        total, idle = read_host_cpu_counters()
        total_delta = total - previous_total
        idle_delta = idle - previous_idle
        previous_total, previous_idle = total, idle
        if total_delta > 0:
            cpu_percent = 100.0 * max(0, total_delta - idle_delta) / total_delta
        else:
            cpu_percent = 0.0
        try:
            memory_percent = read_host_memory_percent()
        except (OSError, KeyError, ValueError, ZeroDivisionError):
            memory_percent = 100.0
        with host_resource_lock:
            host_resource_usage["cpu_percent"] = cpu_percent
            host_resource_usage["memory_percent"] = memory_percent


threading.Thread(target=monitor_host_resources, name="host-resource-monitor", daemon=True).start()


def get_model(model_id: str):
    global loaded_model_id, loaded_model, loaded_tokenizer
    if model_id not in MODEL_SPECS:
        raise HTTPException(status_code=404, detail="Unknown model")
    if loaded_model_id != model_id:
        if loaded_model is not None:
            del loaded_model
            del loaded_tokenizer
            gc.collect()
        revision, _, subfolder = MODEL_SPECS[model_id]
        # Pin each model to an exact Hugging Face commit; some repos store HF
        # Transformers files in a subfolder.
        load_options = {"revision": revision, "trust_remote_code": model_id.startswith("athenista/")}
        if subfolder:
            load_options["subfolder"] = subfolder
        tokenizer_options = {**load_options, "use_fast": model_id != "shibatch/tiny1m"}
        loaded_tokenizer = AutoTokenizer.from_pretrained(
            model_id, **tokenizer_options
        )
        loaded_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
            use_safetensors=True,
            **load_options,
        ).eval()
        loaded_model_id = model_id
    return loaded_model, loaded_tokenizer, MODEL_SPECS[model_id][1]


def make_prompt(messages: list[ChatMessage]) -> str:
    lines = []
    for message in messages:
        role = message.role.strip().upper()
        if role not in {"SYSTEM", "USER", "ASSISTANT"}:
            role = "USER"
        content = message.content.strip()
        if role == "ASSISTANT":
            content = re.sub(
                r'<details class="tavenel-inference-trace">.*?</details>',
                "",
                content,
                flags=re.DOTALL,
            ).strip()
        lines.append(f"{role}: {content}")
    lines.append("ASSISTANT:")
    return "\n\n".join(lines)


def format_trace(model_id: str, prompt_tokens: int, completion_tokens: int,
                 elapsed_seconds: float, cpu_seconds: float,
                 temperature: float, top_p: float, max_tokens: int,
                 prompt_fingerprint: str) -> str:
    revision = MODEL_SPECS[model_id][0]
    energy_low_wh = cpu_seconds * CPU_WATTS_PER_CORE_RANGE[0] / 3600
    energy_high_wh = cpu_seconds * CPU_WATTS_PER_CORE_RANGE[1] / 3600
    co2_low_g = energy_low_wh / 1000 * FRANCE_GRID_GCO2E_PER_KWH
    co2_high_g = energy_high_wh / 1000 * FRANCE_GRID_GCO2E_PER_KWH
    return (
        '\n\n<details class="tavenel-inference-trace">\n'
        "<summary>\U0001f50e Afficher la trace d\u2019inférence et l\u2019impact estimé</summary>\n\n"
        f"Modèle : {model_id} · révision HF {revision[:12]}\n\n"
        f"Paramètres : température {temperature:g} · top-p {top_p:g} · limite {max_tokens} tokens\n\n"
        f"Empreinte du prompt (SHA-256 tronquée) : {prompt_fingerprint}\n\n"
        f"Tokens : {prompt_tokens} en entrée · {completion_tokens} générés\n\n"
        f"Durée : {elapsed_seconds:.2f} s · temps CPU : {cpu_seconds:.2f} s\n\n"
        f"Électricité estimée : {energy_low_wh * 1000:.2f} à {energy_high_wh * 1000:.2f} mWh\n\n"
        f"CO₂e estimé : {co2_low_g:.6f} à {co2_high_g:.6f} gCO₂e\n\n"
        "Estimation CPU : hypothèse de 10 à 20 W par cœur actif, sans compteur électrique, mémoire ni réseau. "
        "Le facteur carbone est 20 gCO₂e/kWh, moyenne annuelle 2025 de l’électricité consommée en France (RTE). "
        "Le VPS Hostinger est situé à Paris. Le facteur est une moyenne nationale, pas une mesure horaire du centre ; le PUE n’est pas mesuré.\n"
        "</details>"
    )


def generate_kwargs(model, tokenizer, prompt: str, context_size: int, request: ChatCompletionRequest):
    max_new_tokens = min(request.max_tokens, max(1, context_size // 2))
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=context_size - max_new_tokens,
    )
    kwargs: dict[str, Any] = {
        **inputs,
        "max_new_tokens": max_new_tokens,
        "do_sample": request.temperature > 0,
        "pad_token_id": tokenizer.eos_token_id,
    }
    if request.temperature > 0:
        kwargs["temperature"] = max(0.01, request.temperature)
        kwargs["top_p"] = request.top_p
    return kwargs, inputs["input_ids"].shape[-1], max_new_tokens


def ensure_host_headroom() -> None:
    with host_resource_lock:
        cpu_percent = host_resource_usage["cpu_percent"]
        memory_percent = host_resource_usage["memory_percent"]
    if cpu_percent >= HOST_RESOURCE_LIMIT_PERCENT or memory_percent >= HOST_RESOURCE_LIMIT_PERCENT:
        raise HTTPException(
            status_code=429,
            detail=(
                "Le VPS est momentanément proche de sa limite de ressources. "
                "Réessayez dans quelques instants. / The VPS is near its resource limit. "
                "Please retry shortly."
            ),
        )


def acquire_generation_slot() -> None:
    ensure_host_headroom()
    if not generation_slots.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail=(
                "Le serveur est momentanément saturé. Réessayez dans quelques instants. "
                "/ The server is temporarily at capacity. Please retry shortly."
            ),
        )


@app.get("/api/public/models")
def public_models():
    return {
        "models": [
            {
                "id": model_id,
                "name": "tiny1m (TinyStories, externe)" if model_id == "shibatch/tiny1m"
                else model_id.removeprefix("athenista/"),
            }
            for model_id in MODEL_SPECS
        ]
    }


@app.post("/api/public/chat")
def public_chat(payload: PublicChatRequest):
    if payload.model not in MODEL_SPECS:
        raise HTTPException(status_code=404, detail="Unknown model")
    if sum(len(message.content) for message in payload.messages) > 4000:
        raise HTTPException(status_code=413, detail="Prompt is too long")
    acquire_generation_slot()
    try:
        with inference_lock:
            ensure_host_headroom()
            model, tokenizer, context_size = get_model(payload.model)
            generation_request = ChatCompletionRequest(
                model=payload.model,
                messages=payload.messages,
                max_tokens=payload.max_tokens,
                temperature=payload.temperature,
                top_p=payload.top_p,
                stream=False,
            )
            kwargs, prompt_tokens, _ = generate_kwargs(
                model, tokenizer, make_prompt(payload.messages), context_size, generation_request
            )
            with torch.inference_mode():
                output = model.generate(**kwargs)
            text = tokenizer.decode(output[0, prompt_tokens:], skip_special_tokens=True)
    finally:
        generation_slots.release()
    return {"model": payload.model, "content": text}


@app.get("/health")
def health():
    with host_resource_lock:
        cpu_percent = host_resource_usage["cpu_percent"]
        memory_percent = host_resource_usage["memory_percent"]
    return {
        "status": "ok",
        "loaded_model": loaded_model_id,
        "host_cpu_percent": round(cpu_percent, 1),
        "host_memory_percent": round(memory_percent, 1),
        "generation_admission_limit_percent": HOST_RESOURCE_LIMIT_PERCENT,
    }


@app.get("/v1/models", dependencies=[Depends(require_api_key)])
def list_models():
    now = int(time.time())
    return {
        "object": "list",
        "data": [
            {
                "id": model_id,
                "object": "model",
                "created": now,
                "owned_by": "shibatch" if model_id.startswith("shibatch/") else "athenista",
            }
            for model_id in MODEL_SPECS
        ],
    }


@app.post("/v1/chat/completions", dependencies=[Depends(require_api_key)])
def chat_completions(request: ChatCompletionRequest):
    if request.model not in MODEL_SPECS:
        raise HTTPException(status_code=404, detail="Unknown model")
    if sum(len(message.content) for message in request.messages) > 4000:
        raise HTTPException(status_code=413, detail="Prompt is too long")
    acquire_generation_slot()

    completion_id = f"chatcmpl-{uuid.uuid4().hex}"
    created = int(time.time())

    def stream_generation():
        with inference_lock:
            ensure_host_headroom()
            model, tokenizer, context_size = get_model(request.model)
            prompt = make_prompt(request.messages)
            kwargs, prompt_tokens, effective_max_tokens = generate_kwargs(
                model, tokenizer, prompt, context_size, request
            )
            prompt_fingerprint = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
            streamer = TextIteratorStreamer(
                tokenizer, skip_prompt=True, skip_special_tokens=True, timeout=600
            )
            errors: list[BaseException] = []
            generation_stats: dict[str, float | int] = {}

            def run_generation():
                try:
                    started_wall = time.perf_counter()
                    started_cpu = time.process_time()
                    with torch.inference_mode():
                        output = model.generate(**kwargs, streamer=streamer)
                    generation_stats["cpu_seconds"] = time.process_time() - started_cpu
                    generation_stats["elapsed_seconds"] = time.perf_counter() - started_wall
                    generation_stats["completion_tokens"] = output.shape[-1] - prompt_tokens
                except BaseException as exc:
                    errors.append(exc)
                    streamer.end()

            worker = threading.Thread(target=run_generation, daemon=True)
            worker.start()
            try:
                yield from streamer
            finally:
                worker.join()
            if errors:
                raise errors[0]
            yield format_trace(
                request.model,
                prompt_tokens,
                int(generation_stats["completion_tokens"]),
                float(generation_stats["elapsed_seconds"]),
                float(generation_stats["cpu_seconds"]),
                request.temperature,
                request.top_p,
                effective_max_tokens,
                prompt_fingerprint,
            )

    if request.stream:
        def events():
            try:
                for piece in stream_generation():
                    if piece:
                        payload = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": request.model,
                            "choices": [{"index": 0, "delta": {"content": piece}, "finish_reason": None}],
                        }
                        yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                final = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": request.model,
                    "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
                }
                yield f"data: {json.dumps(final)}\n\n"
                yield "data: [DONE]\n\n"
            except HTTPException as exc:
                error = {"error": {"message": str(exc.detail), "type": "server_error"}}
                yield f"data: {json.dumps(error, ensure_ascii=False)}\n\n"
            except Exception:
                error = {"error": {"message": "Model generation failed", "type": "server_error"}}
                yield f"data: {json.dumps(error)}\n\n"

        try:
            return StreamingResponse(
                events(),
                media_type="text/event-stream",
                background=BackgroundTask(generation_slots.release),
            )
        except BaseException:
            generation_slots.release()
            raise

    try:
        with inference_lock:
            ensure_host_headroom()
            model, tokenizer, context_size = get_model(request.model)
            prompt = make_prompt(request.messages)
            kwargs, prompt_tokens, effective_max_tokens = generate_kwargs(
                model, tokenizer, prompt, context_size, request
            )
            started_wall = time.perf_counter()
            started_cpu = time.process_time()
            with torch.inference_mode():
                output = model.generate(**kwargs)
            cpu_seconds = time.process_time() - started_cpu
            elapsed_seconds = time.perf_counter() - started_wall
            text = tokenizer.decode(output[0, prompt_tokens:], skip_special_tokens=True)
            completion_tokens = output.shape[-1] - prompt_tokens
            text += format_trace(
                request.model, prompt_tokens, completion_tokens, elapsed_seconds,
                cpu_seconds, request.temperature, request.top_p, effective_max_tokens,
                hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16],
            )
    finally:
        generation_slots.release()
    return {
        "id": completion_id,
        "object": "chat.completion",
        "created": created,
        "model": request.model,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        },
    }

