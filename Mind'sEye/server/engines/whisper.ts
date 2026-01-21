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
