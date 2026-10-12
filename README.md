# Google AI Agent Skills

Agent Skills for Google AI. These skills teach AI agents (Claude Code, Gemini CLI, Cursor, OpenCode, etc.) how to generate **images** and **speech** with Google's Gemini API.

Built following the [Agent Skills](https://agentskills.io) open standard.

## Available Skills

Everything ships as one skill, `skills/gemini/`. `SKILL.md` is a short routing index; each capability's details live in `references/` and load only when needed.

| Capability | Script | Reference |
| ---------- | ------ | --------- |
| Image generation (Nano Banana / Gemini image models) | `scripts/generate_image.js` | `references/image.md` |
| Text-to-speech (single and multi-speaker) | `scripts/tts.js` | `references/tts.md` (voices: `references/tts-voices.md`) |

## Setup

### 1. Get API Key

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

### 2. Set Environment Variable

```bash
export GEMINI_API_KEY="your-api-key"
```

`GOOGLE_API_KEY` works too. A `.env` file is also read, but only from the directory you run the script in:

```
GEMINI_API_KEY=your-api-key
```

### 3. Install SDK

```bash
cd skills/gemini/scripts && npm install
```

## Usage with AI Agents

### 1. Skills CLI (`npx skills`)

The easiest way to use these skills is via the [Skills CLI](https://skills.sh). It automatically installs skills into your `.agent/skills` directory for discovery by agents like Claude Code or Gemini CLI.

```bash
# Install the skill
npx skills add https://github.com/haibinwang9/google-studio-skills/tree/main/skills/gemini

# Or point the CLI at the repository
npx skills add haibinwang9/google-studio-skills
```

### 2. ClawdHub & Moltbot

[Moltbot](https://molt.bot) (formerly Clawdbot) is a local-first AI assistant. You can manage and run these skills using the `clawdhub` CLI.

**Installation & Setup:**
```bash
# Install Moltbot and ClawdHub CLI
npm install -g moltbot clawdhub

# Initialize Moltbot
moltbot onboard
```

**Manage Skills:**
```bash
# Search for Gemini skills on ClawdHub
clawdhub search gemini

# Install a skill to your workspace (~/molt/skills/)
clawdhub install gemini --workdir ~/molt
```

**Running Skills:**
Once installed, interact with Moltbot via the terminal or connected chat apps (WhatsApp/Telegram). Simply ask:
> "Molt, use the gemini skill to make an image of a red cube."

### 3. Manual Installation (Claude Code / Gemini CLI / OpenCode)

These agents automatically discover skills in `skills/` directories. You can manually point your agent to this repository:

```bash
# Clone the repository
git clone https://github.com/haibinwang9/google-studio-skills.git

# Navigate to your project and the agent will discover skills in the adjacent folder
# or add the path to your agent's configuration
```

### 4. Discovery on Skills.sh

Browse the full directory of available skills and see community rankings at [skills.sh](https://skills.sh).

### Manual Usage

Run the scripts from the skill root; install dependencies once with `cd skills/gemini/scripts && npm install`.

```bash
# Image generation
node scripts/generate_image.js "A sunset over mountains" --aspect 16:9 --size 2K

# Text-to-speech
node scripts/tts.js "Hello world" --voice Kore
```

Both scripts write timestamped files by default (`images/`, `audio/`). `--output-dir` sets the directory, `--no-timestamp` drops the timestamp, and `--help` lists every flag.

## Default Models

| Capability | Default Model                  | Notes                     |
| ---------- | ------------------------------ | ------------------------- |
| Image      | `gemini-3.1-flash-image-preview` | Nano Banana 2 default (up to 4K) |
| TTS        | `gemini-3.8-flash-tts`         | 30 prebuilt voices, multi-speaker |

Defaults change often. Check `references/image.md` and `references/tts.md` for the current list before quoting a model name.

## Skill Structure

The skill follows the Agent Skills specification:

```
skills/gemini/
├── SKILL.md           # Routing index for AI agents
├── scripts/           # Executable JavaScript scripts (shared package.json)
│   ├── generate_image.js
│   └── tts.js
└── references/        # One file per capability, loaded on demand
    ├── image.md
    ├── tts.md
    └── tts-voices.md
```

## Development

```bash
# Install dependencies for the scripts
cd skills/gemini/scripts && npm install

# Check the scripts load and print usage
node scripts/generate_image.js --help
node scripts/tts.js --help
```

## License

MIT
