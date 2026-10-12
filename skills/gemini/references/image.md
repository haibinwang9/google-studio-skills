# Gemini Image Generation

Generate images from text prompts with the Gemini image models ("Nano Banana") through `scripts/generate_image.js`.

## When to Use This Skill

Use this skill when you need to:
- Create visual content from a text description
- Produce several variations of one prompt
- Target a specific aspect ratio (social posts, banners, thumbnails)
- Target a specific resolution (1K, 2K, 4K)
- Write generated PNGs into a chosen directory

## Available Scripts

### scripts/generate_image.js
**Purpose**: Generate images with Gemini image models

**Key parameters**:
| Parameter | Description | Example |
|-----------|-------------|---------|
| `prompt` | Text description (required) | `"A futuristic city at sunset"` |
| `--model`, `-m` | Model ID | `gemini-3.1-flash-image-preview` |
| `--output-dir`, `-o` | Output directory | `images/` |
| `--name`, `-n` | Base file name (not a path) | `artwork` |
| `--no-timestamp` | Write `<name>.png` without a timestamp | flag |
| `--aspect`, `-a` | Aspect ratio | `16:9` |
| `--size`, `-s` | Image size | `2K` |
| `--num` | Number of images, 1-4 | `4` |

**Output**: One PNG per image, plus a `Saved: <path>` line each and a final `Generated N image(s)`.

## Workflows

### Workflow 1: Basic generation
```bash
node scripts/generate_image.js "A futuristic city at sunset with flying cars"
```
- Default model: `gemini-3.1-flash-image-preview`
- Output: `images/generated_image_YYYYMMDD_HHMMSS.png`

### Workflow 2: Square social post
```bash
node scripts/generate_image.js "Minimalist coffee shop interior" --aspect 1:1 --size 2K --name coffee-shop
```

### Workflow 3: 16:9 thumbnail
```bash
node scripts/generate_image.js "Tech gadget review thumbnail with vibrant colors" --aspect 16:9 --size 2K --name thumbnail
```

### Workflow 4: Several variations
```bash
node scripts/generate_image.js "Abstract geometric patterns in blue and gold" --num 4 --name abstract
```
- Sends **4 separate requests**, because image models return one image per request (`candidateCount` is rejected for image models).
- Output: `images/abstract_YYYYMMDD_HHMMSS_0.png` … `_3.png` (the `_N` suffix is added whenever more than one image is written).

### Workflow 5: 4K into a project directory
```bash
node scripts/generate_image.js "Detailed architectural rendering of a modern museum" --aspect 16:9 --size 4K --output-dir ./professional/ --name museum
```
- The directory is created automatically before the first request.

### Workflow 6: Fixed file name for a pipeline
```bash
node scripts/generate_image.js "Fixed filename image" --name my-image --no-timestamp
```
- Output: `images/my-image.png`

## Parameters Reference

### Models

| Model | Nickname | Max size | Notes |
|-------|----------|----------|-------|
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | 4K | Default |
| `gemini-3.1-flash-image` | Nano Banana 2 | 4K | Stable version of the default |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 4K | Highest quality, best text rendering |
| `gemini-3-pro-image` | Nano Banana Pro | 4K | Stable version |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | 2K | Cheapest |
| `gemini-nano-banana-2.1` | Nano Banana 2.1 | 4K | Alias |
| `gemini-2.5-flash-image` | Nano Banana | 2K | Older, still available |

Any Gemini image model ID is accepted; the script does not enforce a list, so a new model works without a script change. Model IDs from the docs change often, so check the current list when one is rejected.

**Imagen is gone.** Imagen models (`imagen-4.0-generate-001` and friends) are shut down in the Gemini API, and `models.generateImages` is Vertex-only, so this script only uses `generateContent`. Use a Gemini image model instead.

### Aspect ratios

Supported: `1:1` (default), `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`, `21:9`.

| Ratio | Use case |
|-------|----------|
| 1:1 | Social posts, avatars |
| 16:9 | Video thumbnails, presentations, banners |
| 9:16 | Stories, Shorts, TikTok |
| 4:3 / 3:4 | Slide and document images, portraits |
| 21:9 | Ultrawide banners |

### Resolution

| Size | Use case |
|------|----------|
| `1K` | Default, previews |
| `2K` | Standard web and social assets |
| `4K` | Print and high-detail work; supported by the 3.1-flash-image and 3-pro-image models |

### People in images

The script has no person-generation flag: Gemini image models always allow generating people, and `personGeneration` is not supported by them.

## Output Interpretation

- Default name: `{name}_YYYYMMDD_HHMMSS.png`
- More than one image: `{name}_YYYYMMDD_HHMMSS_0.png`, `_1.png`, …
- `--no-timestamp`: `{name}.png` (or `{name}_0.png` for several images)
- All output is PNG with a SynthID watermark.

## Common Issues

### "Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable"
Export the key, or run from a directory that contains a `.env` (the scripts read `.env` from the working directory only).

### "No image returned by <model>"
- The model ID is not an image model, or the prompt was blocked. The model's text reply, when there is one, is included in the error.
- Check quota: on the free tier most image models have no quota at all, and the API answers `429 RESOURCE_EXHAUSTED`.

### "--name takes a file name, not a path"
Pass the directory with `--output-dir` instead of putting it in `--name`.

### "Unsupported aspect ratio" / "Unsupported size"
Use one of the ratios and sizes above, and remember that 4K needs a 3.1-flash-image or 3-pro-image model.

### "Cannot find package '@google/genai'"
```bash
cd scripts && npm install
```

## Best Practices

- Be specific: subject, style, lighting, mood, composition.
- Describe what you want rather than listing what to avoid.
- Generate at `1K` while iterating, then re-run at `2K`/`4K` for the final asset.
- Each `--num` step is a billable request; raise it only when you actually need alternatives.

## Quick Reference

```bash
# Basic
node scripts/generate_image.js "Your prompt"

# Square
node scripts/generate_image.js "Prompt" --aspect 1:1 --size 2K --name social-post

# Thumbnail
node scripts/generate_image.js "Prompt" --aspect 16:9 --size 2K --name thumbnail

# 4K
node scripts/generate_image.js "Prompt" --aspect 16:9 --size 4K --name high-res

# Four variations
node scripts/generate_image.js "Prompt" --num 4 --name variations

# Fixed file name in a custom directory
node scripts/generate_image.js "Prompt" --output-dir ./my-images/ --name custom --no-timestamp
```

## Reference

- Get an API key: https://aistudio.google.com/apikey
- Image generation docs: https://ai.google.dev/gemini-api/docs/image-generation
- SynthID: https://deepmind.google/technologies/synthid/
