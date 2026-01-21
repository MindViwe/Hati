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
