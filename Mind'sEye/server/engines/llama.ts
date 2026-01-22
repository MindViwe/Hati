import { spawn } from "child_process";
import path from "path";

const LLAMA_BIN = path.resolve(
  process.env.LLAMA_BIN || "./bin/llama-cli"
);

const MODEL_DIR = path.resolve(
  process.env.LLAMA_MODEL_DIR || "/data/data/com.termux/files/home/Hati/models"
);

export function runLlama(
  prompt: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  modelFile: string = "qwen2.5-1.5b-instruct-q4_k_m.gguf"
): void {
  const modelPath = path.join(MODEL_DIR, modelFile);

  const args = [
    "-m", modelPath,
    "-p", prompt,
    "-n", "50",
    "--temp", "0.7",
    "--log-disable"
  ];

  const proc = spawn(LLAMA_BIN, args, {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let fullOutput = "";
  let responseText = "";
  let foundResponse = false;

  proc.stdout.on("data", (data) => {
    const chunk = data.toString();
    fullOutput += chunk;
  });

  proc.stderr.on("data", (data) => {
    // Suppress stderr to avoid cluttering the output
  });

  proc.on("close", (code) => {
    // Process the full output to extract the response
    const lines = fullOutput.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for the line that starts with "B." which contains the actual response
      if (line.startsWith("B.") && !foundResponse) {
        foundResponse = true;
        // Extract everything after "B. "
        responseText = line.substring(2).trim();
        
        // Look for additional lines that might be part of the response
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          
          // Stop if we hit performance stats
          if (nextLine.includes('main: decoded') || 
              nextLine.includes('llama_perf')) {
            break;
          }
          
          // Add the line if it's not empty and doesn't look like debug info
          if (nextLine && 
              !nextLine.includes('llama_') && 
              !nextLine.includes('main:') && 
              !nextLine.includes('eval time') &&
              !nextLine.includes('prompt eval') &&
              !nextLine.includes('load time') &&
              !nextLine.includes('graph') &&
              !nextLine.includes('sched') &&
              !nextLine.includes('layer') &&
              !nextLine.includes('tensor')) {
            responseText += " " + nextLine;
          }
        }
        break;
      }
    }
    
    // Clean up the response
    responseText = responseText
      .replace(/^\s*$/gm, '') // Remove empty lines
      .trim();
    
    if (responseText) {
      onToken(responseText);
    } else {
      onToken("I'm processing your request. Please give me a moment to think...");
    }
    
    onComplete();
  });
  
  proc.on("error", (error) => {
    console.error("[llama.cpp] Process error:", error);
    onError(error);
  });
}
