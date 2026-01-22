import express from "express";
import { runLlama } from "../engines/llama";
import { runWhisper } from "../engines/whisper";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/chat", (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  let fullResponse = "";
  let responseComplete = false;

  runLlama(
    prompt,
    (token) => {
      fullResponse += token;
    },
    () => {
      if (!responseComplete) {
        responseComplete = true;
        // Clean up the response
        const cleanResponse = fullResponse
          .replace(/\[llama\.cpp\].*?\n/g, '')
          .replace(/llama_context.*?\n/g, '')
          .replace(/sched_reserve.*?\n/g, '')
          .replace(/graph_reserve.*?\n/g, '')
          .replace(/main:.*?\n/g, '')
          .replace(/llama_perf.*?\n/g, '')
          .trim();
        
        if (cleanResponse) {
          res.json({ response: cleanResponse });
        } else {
          res.json({ response: "I'm thinking about your question..." });
        }
      }
    },
    (err) => { 
      console.error(err); 
      if (!responseComplete) {
        responseComplete = true;
        res.status(500).json({ error: "Failed to generate response" });
      }
    },
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
