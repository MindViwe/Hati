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
