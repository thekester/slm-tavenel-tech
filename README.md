# SLM-Tavenel Tech

Code for the public SLM-Tavenel chat at [slm.tavenel.tech](https://slm.tavenel.tech). It lets visitors try experimental language models published by [Avenel on Hugging Face](https://huggingface.co/athenista).

The chat interface uses [Open WebUI](https://github.com/open-webui/open-webui) with a Transformers inference API. This customized instance is independent and is not the official Open WebUI product. Check the [Open WebUI license](https://docs.openwebui.com/license/) before redistributing Open WebUI components or branding.

## Models

- [SLM-Tavenel models](https://huggingface.co/athenista)
- [Third-party TinyStories model](https://huggingface.co/shibatch/tiny1m)

The SLM-Tavenel releases are experimental base models, not instruction-tuned assistants. Their outputs can be incoherent or inaccurate. Model cards describe their data provenance, declared licenses, and known review limitations.

## Repository layout

- `model-api/`: OpenAI-compatible Transformers inference API and host resource guard.
- `privacy-ui/`: bilingual privacy, feedback, provenance, and Open WebUI information panels.
- `compose.yaml`: Docker Compose services and resource caps.
- `Caddyfile.snippet`: reverse-proxy configuration example.
- `README-HOSTINGER.md`: Hostinger MCP connection instructions.
- `.env.example`: names of locally required configuration variables, with no populated secrets.

## Resource safeguards

The inference container is capped at 1.2 vCPU and 4 GiB RAM. New generations are refused when host CPU or memory reaches 80%. Up to 32 generations can be active or queued; connected visitors who are not generating do not consume a generation slot. The API defaults to 192 output tokens and allows up to 256, subject to the model context window.

## Run locally

1. Copy `.env.example` to `.env` and set fresh local values for each required variable.
2. Start the services with `docker compose up --build -d`.
3. Configure a reverse proxy and TLS before exposing the interface publicly.

Never commit `.env`, passwords, API keys, SSH keys, or private certificates. The repository ignores local environment files and key material. The legacy `public-chat/guest-login.html` is excluded because it contains a hard-coded shared password.

## Maintainer

Théophile Avenel develops and publishes these experimental language models and documents their data sources, declared licenses, and limitations. For questions or discussion, contact him on [LinkedIn](https://www.linkedin.com/in/theophile-avenel/) or by email at [slm-tavenel-tech@proton.me](mailto:slm-tavenel-tech@proton.me).

