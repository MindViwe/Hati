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
  baseUrl: "http://localhost:11434",
  model: "llama3",
  enabled: false,
};

export const DEFAULT_WHISPER_CONFIG: WhisperConfig = {
  serverUrl: "http://localhost:8080", // Default for whisper.cpp server
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
    throw new Error("Local Llama3 is not enabled");
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Failed to connect to local Llama3:", error);
    throw error;
  }
}

export async function transcribeWithLocalWhisper(audioBlob: Blob): Promise<string> {
  const config = getWhisperConfig();
  
  if (!config.enabled) {
    throw new Error("Local Whisper is not enabled");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  formData.append("response_format", "json");

  try {
    const response = await fetch(`${config.serverUrl}/inference`, {
      method: "POST",
      body: formData,
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
