# Gemini Text-to-Speech

Generate single-speaker or multi-speaker speech with `scripts/tts.js`, which calls the Interactions API (`client.interactions.create`). The text is treated as a verbatim transcript; delivery is controlled with `--style` and inline tags.

## Quick reference

```bash
node scripts/tts.js "Have a wonderful day!"
node scripts/tts.js "Welcome!" --voice Puck --output welcome
node scripts/tts.js "Good news!" --style "cheerful and excited"
node scripts/tts.js "$(cat dialogue.txt)" --speakers "Joe:Puck,Jane:Kore" --mode conversational
node scripts/tts.js "Long article..." --stream --output long-form
node scripts/tts.js "Voice from design" --voice voice_abc123   # custom voice ID
```

Output is a WAV file (24 kHz, mono, 16-bit) in `audio/` by default, named `<output>_<timestamp>.wav`. The output directory is created before the request is sent, so a bad directory never costs an API call. `--output` must be a file name: pass paths through `--output-dir` and the script rejects anything else.

## Options

| Option | Purpose | Default |
|--------|---------|---------|
| `--voice`, `-v` | Prebuilt voice name, or a `voice_...` ID from Voice design / Voice replication | `Kore` |
| `--style` | `speech_metadata.style` applied to every turn | none |
| `--speakers` | Multi-speaker map, max 2: `"Joe:Puck,Jane:Kore"` | none |
| `--mode` | Turn cadence for multi-speaker, e.g. `conversational` (requires `--speakers`) | none |
| `--model`, `-m` | `gemini-3.8-flash-tts` or `gemini-3.8-flash-lite-tts` | `gemini-3.8-flash-tts` |
| `--stream`, `-s` | Stream PCM chunks and save them as one WAV | off |
| `--output-dir` | Output directory | `audio/` |
| `--output`, `-o` | Base file name (not a path) | `tts_output` |
| `--no-timestamp` | Write `<output>.wav` without a timestamp | off |

## Single speaker

The whole text is one transcript. `--style` sets sustained delivery for the turn:

```bash
node scripts/tts.js "We need to leave now." --style "whispered urgently" --voice Charon
```

## Multi-speaker

With `--speakers`, each line must start with a speaker name from the map. Each line becomes its own turn with a `speech_metadata.speaker` annotation, so the speaker name is never read aloud. A line without a prefix continues the previous turn. A first line without a prefix is an error.

```text
Joe: How's it going today, Jane?
Jane: Not too bad, how about you?
Joe: Ready to test these new voices?
```

Limits: at most 2 speakers per request, and prebuilt voices only. To mix custom voices (`voice_...`) into a dialogue, synthesize each speaker's turns separately and join the audio.

## Style and inline tags

Split performance instructions by scope:

- **Turn-level style** (`--style`, or `speech_metadata.style`): emotion, pace, prosody, such as `"out of breath"`, `"speaking slowly"`, `"sarcastic"`. Leave it empty for plain speech, and keep it short for a consistent baseline.
- **Point-in-time tags** (inline, in angle brackets): `<laugh>`, `<sigh>`, `<cough>`, `<breath>`, `<gasp>`, `<throat-clearing>`, `<short pause>`, `<long pause>`. Use human vocalizations only, not sound effects like applause.

Do not put stage directions in the text itself, and do not write "Speak cheerfully:" as a prefix; the model would read it out. Use `--style` instead.

```bash
node scripts/tts.js "Wait... <short pause> did you hear that? <sigh> Never mind." --style "tired but calm"
```

Tips: capitalize a word for emphasis, use `...` and `--` for hesitation, and write natural spoken transcripts. Keep persona-level traits (age, gender, accent) out of `--style`; choose a voice with them instead.

## Streaming

`--stream` sends `stream: true` and receives raw 16-bit little-endian PCM at 24 kHz. The script concatenates the chunks and wraps them in a WAV header, so the output file looks the same as a unary result.

## Output formats

The script requests formats explicitly. Unary requests use `audio/wav`; streaming uses `audio/l16`. The API also supports `audio/mulaw` and `audio/alaw` (8 kHz telephony) and other `sample_rate` values, but `scripts/tts.js` does not expose these. Change `response_format` in the script if needed.

## Models

| Model | Use for |
|-------|---------|
| `gemini-3.8-flash-tts` (default) | Highest quality, expressive control, complex multi-speaker dialogue, long narration |
| `gemini-3.8-flash-lite-tts` | High volume, low cost, voice agents, read-aloud, everyday single-speaker speech |

Both support single speaker, multi-speaker, Voice design, and Voice replication, and both use the same request format. Languages are detected automatically: over 130 for `gemini-3.8-flash-tts`, over 100 for `gemini-3.8-flash-lite-tts`.

Older preview models are being retired. `gemini-3.1-flash-tts-preview` and `gemini-2.5-pro-preview-tts` are still listed as supported, but migrate them to the 3.8 models. `gemini-2.5-flash-preview-tts` (the old default in this skill) is no longer in the official supported list.

## Migration from the earlier version of this skill

- Default model is now `gemini-3.8-flash-tts`.
- Output is a complete WAV from the API; no manual header is added to unary results.
- Speaker turns use structured `speech_metadata.speaker`, not `Name:` text prefixes sent verbatim.
- Voice names: `Kore` and `Puck` still work; the full prebuilt list changed, see `references/tts-voices.md`.

## Voice options

- **Prebuilt studio voices:** 30 voices, see `references/tts-voices.md`.
- **Extended Voice Library:** hundreds more, filterable by language, accent, gender, and use case, via `client.voices.list()` (`GET /v1beta/voices`, `@google/genai` 2.25+ for Python, 2.24+ for JS).
- **Voice design:** create a persistent `voice_...` persona from a text description (`POST /v1beta/voices`, `type="prompted"`).
- **Voice replication:** `voice_...` (stored) or `voicekey_...` (stateless, 7-day TTL) from reference audio with consent.

Stored custom voices are limited to 200 per project and expire after 1 year without use.

## Troubleshooting

- **"Line N must start with a speaker"**: the first line of a `--speakers` run has no `Name:` prefix, or the name is misspelled (names are case-sensitive).
- **"No audio generated"**: check that the text is not empty and the model name is correct, then check quota.
- **`--output takes a file name, not a path`**: put the directory in `--output-dir`, not in `--output`.
- **Audio sounds wrong or bad pronunciation**: try another voice, spell out abbreviations, or split very long text into shorter requests.

## See also

- `references/tts-voices.md` for the full prebuilt voice list.
