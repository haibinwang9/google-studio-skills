---
name: gemini
description: Generate images and speech with the Google Gemini API through the scripts in this skill. Image generation with Gemini image models (Nano Banana, gemini-3.1-flash-image, gemini-3-pro-image) including aspect ratio, 1K/2K/4K sizes and multiple outputs; text-to-speech with gemini-3.8-flash-tts including single speaker, two-speaker dialogue, delivery style and WAV output. Triggers on image generation, generate an image, text to speech, TTS, voiceover, narration, Nano Banana, Gemini image, Gemini TTS.
license: MIT
version: 3.0.0
---

# Gemini

Two capabilities, one script each. Pick one below, then read only its reference file for options and workflows.

## Setup

```bash
export GEMINI_API_KEY="your-api-key"   # or GOOGLE_API_KEY
```

Run all commands from the skill root as `node scripts/<name>.js ...`. The scripts load a `.env` from the current working directory only, so prefer the exported variable when running from anywhere else. If `scripts/node_modules` is missing, install it in `scripts/` with `npm install`.

## Capabilities

| Task | Script | Reference (read first) |
|------|--------|------------------------|
| Generate images (Nano Banana / Gemini image models) | `scripts/generate_image.js` | `references/image.md` |
| Text-to-speech, single speaker or two-speaker dialogue | `scripts/tts.js` | `references/tts.md` (voices: `references/tts-voices.md`) |

## Common rules

- Both scripts write timestamped files by default, into `images/` and `audio/` respectively. `--output-dir` sets the directory, `--no-timestamp` drops the timestamp.
- The name flags (`--name` for images, `--output` for audio) are file names, not paths; a path there is rejected, use `--output-dir`.
- `--num N` on the image script sends N requests, because image models return one image per request.
- Run a script with `--help` when unsure about flags.
- Check the reference for the current default model before quoting model names; defaults change often.
