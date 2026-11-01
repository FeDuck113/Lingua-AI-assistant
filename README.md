# Lingua AI Assistant

A microservice-based service for practicing foreign languages through voice messages. Users send a voice message and receive a spoken reply with a written explanation of language errors.

The current interface is a Telegram bot and can be easily replaced with another client.<br>The current AI provider is GigaChat; the AI module can be adapted to use another language model.

The current setup is intended for practice from Russian into other supported languages. The target language can be changed. Language availability is limited by the languages supported by the selected TTS model.

## Architecture

```mermaid
flowchart LR
    U[User] --> B[Telegram bot · aiogram]
    B --> C[Core API · Elysia / Bun]
    C --> S[STT · Whisper]
    C --> G[LLM · GigaChat]
    C --> T[TTS · Kokoro]
    C <--> D[(PostgreSQL)]
    C --> B --> U
```

The system consists of independently running services: Telegram bot, core API, STT, and TTS. Core processes audio, calls STT, the language model, and TTS, and stores messages in PostgreSQL. Other clients can connect through the core API.

## Repository structure

| Directory | Contents |
|---|---|
| `core/` | API, model integrations, PostgreSQL schema and migrations. |
| `tg_bot/` | Telegram bot and message handlers. |
| `speech_to_text/` | Whisper STT notebook. |
| `text_to_speech/` | Kokoro TTS notebook. |

## Setup

### Core API

Create `core/.env` from `core/.env.example` and set `GIGACHAT_API_KEY`:

```dotenv
GIGACHAT_API_KEY=your_key
DATABASE_URL=postgresql://user:password@localhost:5432/lingua
STT_URL=http://localhost:5000
TTS_URL=http://localhost:5001
```

Create a PostgreSQL database, then start the core:

```bash
cd core
bun install
bun run migrate
bun run dev
```

API: `http://localhost:3000`<br>Swagger: `http://localhost:3000/swagger`

### STT and TTS

Open each service notebook, install its dependencies, set an `ngrok` token, and run the cells. Set the resulting tunnel URLs as `STT_URL` and `TTS_URL`.

### Telegram bot

Create `bot.ini` in the repository root:

```ini
[tg_bot]
token = your_bot_token
admin_id = 123456789
```

```bash
python -m pip install -r tg_bot/requirements.txt
python -m tg_bot.cli
```

Requires Python 3.12 and `ffmpeg`.

### Docker Compose

`docker-compose.yml` defines the core and bot containers. To run them, add `core/Dockerfile`, configure PostgreSQL, create `bot.ini`, and replace the placeholder core environment values.

## Bot commands

- `/start` — start a session and choose a level (A1–C2).
- `/lang_american_english`, `/lang_british_english`, `/lang_spanish`, `/lang_french`, `/lang_hindi`, `/lang_italian`, `/lang_japanese`, `/lang_brazilian_portuguese`, `/lang_mandarin_chinese` — choose a target language.
- `/clear` — start a new session.

## STT and TTS model comparison

### STT

The comparison score combines WER and inference time. Lower WER and shorter time improve the score:

```text
normalized_time = min(time, 2) / 2
score = 1 / (0.6 × min(WER, 1) + 0.4 × normalized_time)
```

WER values above 1 were capped at 1 and inference times above 2 seconds were capped at 2 seconds before scoring. Higher scores are better.

| Model | Median WER | Median time (s) | Score ↑ |
|---|---:|---:|---:|
| wav2vec2 | 0.444444 | **0.027207** | 3.675011 |
| Whisper | **0.076923** | 1.345567 | 3.171912 |
| Whisper Turbo | 0.083333 | 0.909816 | **4.311030** |

### TTS

Generation time statistics for 200 samples per model. Kokoro-82M was selected for its better speech quality despite taking slightly longer to generate audio.

| Time statistic (s) | Kokoro-82M | Facebook MMS-TTS | Bark-small |
|---|---:|---:|---:|
| Mean | 6.547600 | **5.461173** | 14.679163 |
| Std. dev. | **1.153025** | 1.344183 | 5.667858 |
| Min | 4.390000 | **3.150637** | 7.065972 |
| 25th percentile | 5.705000 | **4.434931** | 10.737079 |
| Median | 6.375000 | **5.320785** | 13.298300 |
| 75th percentile | 7.260000 | **6.179457** | 16.948925 |
| Max | **9.950000** | 10.421453 | 35.827799 |

## API

| Service | Method and path | Request | Response |
|---|---|---|---|
| Core | `POST /api/v1/audio` | Multipart: `file`, `language`, `level`, `sessionUUID`, `username`. | JSON with Base64-encoded `audio` and `explanation`. |
| STT | `POST /get_data/` | Multipart: `audio`, `language`. | JSON: `{"text":"..."}`. |
| TTS | `POST /audio` | JSON: `{"text":"...","language":"en"}`. | WAV audio file. |
| TTS | `GET /audio` | — | Usage information for `POST /audio`. |

The STT and TTS notebooks also define `GET /`, which returns `200`

## License

GNU GPL v3. See [`LICENSE`](LICENSE).
