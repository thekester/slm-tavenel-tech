FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/var/cache/huggingface

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.10.0 \
    && pip install --no-cache-dir transformers==4.57.6 tokenizers==0.22.2 sentencepiece==0.2.1 safetensors==0.8.0 fastapi==0.135.0 uvicorn[standard]==0.41.0

COPY main.py ./main.py
RUN useradd --create-home --uid 10001 app \
    && mkdir -p /var/cache/huggingface \
    && chown -R app:app /app /var/cache/huggingface

USER 10001:10001
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

