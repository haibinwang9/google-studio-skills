# Gemini TTS Voices

## Prebuilt studio voices (30)

Pass the name as `--voice` (single speaker) or in `--speakers` (multi-speaker). Names are case-sensitive.

| Voice | Character | Voice | Character |
|-------|-----------|-------|-----------|
| Zephyr | Bright | Achernar | Soft |
| Puck | Upbeat | Alnilam | Firm |
| Charon | Informative | Schedar | Even |
| Kore | Firm (default) | Gacrux | Mature |
| Fenrir | Excitable | Pulcherrima | Forward |
| Leda | Youthful | Achird | Friendly |
| Orus | Firm | Zubenelgenubi | Casual |
| Aoede | Breezy | Vindemiatrix | Gentle |
| Callirrhoe | Easy-going | Sadachbia | Lively |
| Autonoe | Bright | Sadaltager | Knowledgeable |
| Enceladus | Breathy | Sulafat | Warm |
| Iapetus | Clear | Laomedeia | Upbeat |
| Umbriel | Easy-going | Rasalgethi | Informative |
| Algieba | Smooth | Erinome | Clear |
| Despina | Smooth | Algenib | Gravelly |

## Picking a voice

- **Announcements, corporate:** Kore, Charon, Alnilam, Gacrux
- **Podcasts, casual conversation:** Puck, Zubenelgenubi, Achird, Umbriel
- **Storytelling, audiobooks:** Fenrir, Aoede, Algieba, Sulafat
- **Calm, gentle, meditation:** Vindemiatrix, Achernar, Enceladus, Despina
- **Education, tutorials:** Zephyr, Iapetus, Erinome, Rasalgethi
- **Documentary, factual:** Sadaltager, Charon, Rasalgethi

The descriptors are from the official docs. The groupings above are suggestions built on them; test with your target text.

## Multi-speaker

Two speakers per request, both prebuilt:

```bash
node scripts/tts.js "$(cat dialogue.txt)" --speakers "Narrator:Aoede,Character:Puck"
```

## Custom voices

- **Voice design**: `--voice voice_...` from a text description (see `references/tts.md`).
- **Voice replication**: `--voice voice_...` or `voicekey_...` from reference audio.
- **Extended Voice Library**: hundreds more voices, listed with `client.voices.list()` (`GET /v1beta/voices`). Filter by `language_code`, `accent`, `gender`, `pitch`, `contexts`, `type`, or `search`.
