#!/usr/bin/env node
"use strict";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const DEFAULT_VOICE = "Kore";
const DEFAULT_OUTPUT_DIR = "audio/";
const DEFAULT_OUTPUT_NAME = "tts_output";
const DEFAULT_MODEL = "gemini-3.8-flash-tts";
const SAMPLE_RATE = 24000;
const MAX_SPEAKERS = 2;

function printUsage() {
  console.log(`Generate speech from text using the Gemini TTS Interactions API.

Usage:
  node scripts/tts.js "Hello, world!"
  node scripts/tts.js "Welcome!" --voice Puck --output welcome
  node scripts/tts.js "Good news!" --style "cheerful and excited"
  node scripts/tts.js "$(cat dialogue.txt)" --speakers "Joe:Puck,Jane:Kore"
  node scripts/tts.js "Long text" --stream
  node scripts/tts.js "Custom folder" --output-dir ./my-audio/

Options:
  --voice, -v        Prebuilt voice name or voice_... ID (default: ${DEFAULT_VOICE})
  --style            Delivery style applied to every turn, e.g. "whispered urgently"
  --speakers         Multi-speaker map, max ${MAX_SPEAKERS}: "Joe:Puck,Jane:Kore"
                     With this flag, each text line must start with "Speaker: "
                     Lines without a speaker prefix continue the previous turn.
  --mode             Turn cadence for multi-speaker, e.g. "conversational" (needs --speakers)
  --output-dir       Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --output, -o       Base output name, not a path (default: ${DEFAULT_OUTPUT_NAME})
  --no-timestamp     Disable timestamp in filename
  --model, -m        TTS model ID (default: ${DEFAULT_MODEL}, or gemini-3.8-flash-lite-tts)
  --stream, -s       Stream audio; raw PCM chunks are wrapped into one WAV file
  --help, -h         Show this help message

Requirements:
  npm install
`);
}

function getApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable");
  }
  return apiKey;
}

function parseSpeakers(input) {
  const entries = [];
  for (const pair of input.split(",")) {
    if (!pair.includes(":")) continue;
    const [speaker, voice] = pair.split(":", 2).map((v) => v.trim());
    if (speaker && voice) {
      entries.push({ speaker, voice });
    }
  }
  return entries;
}

function buildWavBuffer(pcmData, sampleRate = SAMPLE_RATE) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);
  return buffer;
}

// Unary requests already return a RIFF/WAV container; only wrap if the API ever sends raw PCM.
function ensureWav(audio) {
  return audio.subarray(0, 4).toString("ascii") === "RIFF" ? audio : buildWavBuffer(audio);
}

function buildFilename(baseName, useTimestamp) {
  if (!useTimestamp) {
    return baseName.endsWith(".wav") ? baseName : `${baseName}.wav`;
  }
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${baseName}_${yyyy}${mm}${dd}_${hh}${mi}${ss}.wav`;
}

function buildTurn(text, metadata) {
  const turn = { type: "text", text };
  if (Object.keys(metadata).length > 0) {
    turn.annotations = [{ type: "speech_metadata", ...metadata }];
  }
  return turn;
}

// Single speaker: one verbatim transcript. Multi-speaker: one content item per turn,
// so speaker names are never read aloud as part of the text.
function buildContent(text, speakers, style) {
  const styleMeta = style ? { style } : {};
  if (speakers.length === 0) {
    return [buildTurn(text.trim(), styleMeta)];
  }

  const names = speakers.map((entry) => entry.speaker);
  const turns = [];
  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    const speaker = match ? match[1].trim() : undefined;
    if (speaker && names.includes(speaker)) {
      turns.push({ speaker, text: match[2].trim() });
    } else if (turns.length > 0) {
      turns[turns.length - 1].text += ` ${line}`;
    } else {
      throw new Error(`Line ${index + 1} must start with a speaker (${names.join(", ")}): "${line}"`);
    }
  });

  return turns
    .filter((turn) => turn.text)
    .map((turn) => buildTurn(turn.text, { speaker: turn.speaker, ...styleMeta }));
}

function buildSpeechConfig({ voice, speakers, mode }) {
  if (speakers.length === 0) {
    return [{ voice }];
  }
  return {
    ...(mode ? { mode } : {}),
    speakers: speakers.map((entry) => ({ speaker: entry.speaker, voice: entry.voice })),
  };
}

async function generateTts({ text, voice, style, mode, speakers, outputDir, outputName, model, stream, useTimestamp }) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  await mkdir(outputDir, { recursive: true });

  const request = {
    model,
    input: [{ type: "user_input", content: buildContent(text, speakers, style) }],
    generation_config: {
      speech_config: buildSpeechConfig({ voice, speakers, mode }),
    },
  };

  let wavData;
  if (stream) {
    console.log("Streaming audio...");
    const responseStream = await ai.interactions.create({
      ...request,
      response_format: { type: "audio", mime_type: "audio/l16", sample_rate: SAMPLE_RATE },
      stream: true,
    });
    const chunks = [];
    for await (const event of responseStream) {
      if (event.event_type === "step.delta" && event.delta?.type === "audio" && event.delta.data) {
        chunks.push(Buffer.from(event.delta.data, "base64"));
      }
    }
    if (chunks.length === 0) {
      throw new Error("No audio generated");
    }
    wavData = buildWavBuffer(Buffer.concat(chunks), SAMPLE_RATE);
  } else {
    const interaction = await ai.interactions.create({
      ...request,
      response_format: { type: "audio", mime_type: "audio/wav", sample_rate: SAMPLE_RATE },
    });
    const data = interaction.output_audio?.data;
    if (!data) {
      throw new Error("No audio generated");
    }
    wavData = ensureWav(Buffer.from(data, "base64"));
  }

  const fullPath = path.join(outputDir, buildFilename(outputName, useTimestamp));
  await writeFile(fullPath, wavData);
  console.log(`Saved: ${fullPath}`);
  return fullPath;
}

function parseCli() {
  const { values, positionals } = parseArgs({
    options: {
      voice: { type: "string", short: "v", default: DEFAULT_VOICE },
      style: { type: "string" },
      speakers: { type: "string" },
      mode: { type: "string" },
      "output-dir": { type: "string", default: DEFAULT_OUTPUT_DIR },
      output: { type: "string", short: "o", default: DEFAULT_OUTPUT_NAME },
      "no-timestamp": { type: "boolean", default: false },
      model: { type: "string", short: "m", default: DEFAULT_MODEL },
      stream: { type: "boolean", short: "s", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  if (positionals.length === 0) {
    printUsage();
    process.exit(1);
  }

  const speakers = values.speakers ? parseSpeakers(values.speakers) : [];
  if (values.speakers && speakers.length === 0) {
    throw new Error('--speakers must look like "Joe:Puck,Jane:Kore"');
  }
  if (speakers.length > MAX_SPEAKERS) {
    throw new Error(`Multi-speaker generation supports at most ${MAX_SPEAKERS} speakers`);
  }
  if (values.mode && speakers.length === 0) {
    throw new Error("--mode requires --speakers");
  }
  if (values.output !== path.basename(values.output)) {
    throw new Error(
      `--output takes a file name, not a path (got "${values.output}"); use --output-dir for the directory`,
    );
  }

  return {
    text: positionals.join(" "),
    voice: values.voice,
    style: values.style,
    mode: values.mode,
    speakers,
    outputDir: values["output-dir"],
    outputName: values.output,
    model: values.model,
    stream: values.stream,
    useTimestamp: !values["no-timestamp"],
  };
}

async function main() {
  try {
    const options = parseCli();
    await generateTts(options);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

await main();
