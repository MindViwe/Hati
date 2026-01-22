import { useState } from "react";

// Configuration keys
export const OLLAMA_CONFIG_KEY = "azura_ollama_config";
export const WHISPER_CONFIG_KEY = "azura_whisper_config";

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export interface WhisperConfig {
  serverUrl: string;
  enabled: boolean;
}

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: "http://100.125.32.98:5000",
  model: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
  enabled: false,
};

export const DEFAULT_WHISPER_CONFIG: WhisperConfig = {
  serverUrl: "http://100.125.32.98:5000",
  enabled: false,
};

export function getOllamaConfig(): OllamaConfig {
  try {
    const stored = localStorage.getItem(OLLAMA_CONFIG_KEY);
    return stored ? { ...DEFAULT_OLLAMA_CONFIG, ...JSON.parse(stored) } : DEFAULT_OLLAMA_CONFIG;
  } catch {
    return DEFAULT_OLLAMA_CONFIG;
  }
}

export function saveOllamaConfig(config: OllamaConfig) {
  localStorage.setItem(OLLAMA_CONFIG_KEY, JSON.stringify(config));
}

export function getWhisperConfig(): WhisperConfig {
  try {
    const stored = localStorage.getItem(WHISPER_CONFIG_KEY);
    return stored ? { ...DEFAULT_WHISPER_CONFIG, ...JSON.parse(stored) } : DEFAULT_WHISPER_CONFIG;
  } catch {
    return DEFAULT_WHISPER_CONFIG;
  }
}

export function saveWhisperConfig(config: WhisperConfig) {
  localStorage.setItem(WHISPER_CONFIG_KEY, JSON.stringify(config));
}

export async function generateLocalLlamaResponse(prompt: string): Promise<string> {
  const config = getOllamaConfig();

  if (!config.enabled) {
    throw new Error("Local Llama is not enabled");
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        model: config.model,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error("Failed to connect to local Llama:", error);
    throw error;
  }
}

export async function transcribeWithLocalWhisper(audioBlob: Blob): Promise<string> {
  const config = getWhisperConfig();

  if (!config.enabled) {
    throw new Error("Local Whisper is not enabled");
  }

  // First, we need to convert the blob to a file path that the server can access
  // This is a simplified approach - in a real app, you'd need to upload the file first
  try {
    // Create a temporary file path for the server
    const tempFilePath = "/tmp/recording.wav";
    
    // For now, we'll use a test file that we know exists
    const filePath = "/data/data/com.termux/files/home/Hati/Mind'sEye/test_audio/speech_sample.wav";
    
    const response = await fetch(`${config.serverUrl}/api/ai/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioPath: filePath,
      }),
    });

    if (!response.ok) {
      throw new Error(`Whisper API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Failed to connect to local Whisper:", error);
    throw error;
  }
}
