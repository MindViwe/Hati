#!/bin/bash
# AUTOMATE Mind'sEye AI ENGINE SETUP
# Run this from ~/sdcard/MindsEye/Mind'sEye

echo "Setting up Mind'sEye engines and routes..."

cd server || { echo "server folder not found!"; exit 1; }

mkdir -p engines routes

cat > engines/llama.ts << 'EOF'
import { spawn } from "child_process";
import path from "path";

const LLAMA_BIN = path.resolve(
  process.env.LLAMA_BIN || "./bin/llama"
);

const MODEL_DIR = path.resolve(
  process.env.MODEL_DIR || "../models"
);

export function runLlama(
  prompt: string,
  onToken: (token: string) => void,
  onEnd: () => void,
  onError: (err: any) => void,
  modelFile: string
) {
  const modelPath = path.join(MODEL_DIR, modelFile);

  const args = [
    "-m", modelPath,
    "-p", prompt,
    "--ctx-size", "4096",
    "--n-predict", "512",
    "--temp", "0.7",
    "--color", "false"
  ];

  const proc = spawn(LLAMA_BIN, args);

  proc.stdout.on("data", (data) => {
    onToken(data.toString());
  });

  proc.stderr.on("data", (data) => {
    console.error("[llama.cpp]", data.toString());
  });

  proc.on("close", () => {
    onEnd();
  });

  proc.on("error", (err) => {
    onError(err);
  });

  return proc;
}
EOF

cat > engines/whisper.ts << 'EOF'
import { spawn } from "child_process";
import path from "path";

const WHISPER_BIN = path.resolve(
  process.env.WHISPER_BIN || "./bin/whisper"
);

const MODEL_DIR = path.resolve(
  process.env.WHISPER_MODEL_DIR || "../models"
);

export function runWhisper(
  audioFile: string,
  modelFile: string = "base.en.bin"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const modelPath = path.join(MODEL_DIR, modelFile);

    const args = [
      "-m", modelPath,
      "-f", audioFile
    ];

    const proc = spawn(WHISPER_BIN, args);

    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      console.error("[whisper.cpp]", data.toString());
    });

    proc.on("close", () => {
      resolve(output.trim());
    });

    proc.on("error", reject);
  });
}
EOF

cat > routes/ai.ts << 'EOF'
import express from "express";
import { runLlama } from "../engines/llama";
import { runWhisper } from "../engines/whisper";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/chat", (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  runLlama(
    prompt,
    (token) => res.write(token),
    () => res.end(),
    (err) => { console.error(err); res.end("\n[Error]"); },
    model || "qwen2.5-1.5b-instruct-q4_k_m.gguf"
  );
});

router.post("/transcribe", async (req, res) => {
  try {
    const { audioPath } = req.body;
    if (!audioPath || !fs.existsSync(audioPath)) return res.status(400).json({ error: "Invalid audio file" });

    const text = await runWhisper(audioPath);
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
EOF

INDEX_FILE="index.ts"
IMPORT_LINE="import aiRoutes from \"./routes/ai\";"
USE_LINE="app.use(\"/api/ai\", aiRoutes);"

grep -qxF "$IMPORT_LINE" $INDEX_FILE || sed -i "1i$IMPORT_LINE" $INDEX_FILE
grep -qxF "$USE_LINE" $INDEX_FILE || echo -e "\n$USE_LINE" >> $INDEX_FILE

echo "✅ Mind'sEye engines and AI routes created successfully!"
