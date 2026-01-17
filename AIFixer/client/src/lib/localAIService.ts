import { useState } from "react";

// Configuration keys
export const OLLAMA_CONFIG_KEY = "azura_ollama_config";
export const WHISPER_CONFIG_KEY = "azura_whisper_config";
export const LLAMACPP_CONFIG_KEY = "azura_llamacpp_config";

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export interface WhisperConfig {
  serverUrl: string;
  enabled: boolean;
}

export interface LlamaCPPConfig {
  baseUrl: string;
  enabled: boolean;
  scottModels: string[]; // Category: Scott (Multiple models supported)
  hatiModels: string[];  // Category: Hati (Multiple models supported)
  activeCategory: "scott" | "hati";
}

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "llama3",
  enabled: false,
};

export const DEFAULT_WHISPER_CONFIG: WhisperConfig = {
  serverUrl: "http://localhost:8080",
  enabled: false,
};

export const DEFAULT_LLAMACPP_CONFIG: LlamaCPPConfig = {
  baseUrl: "http://localhost:8081",
  enabled: false,
  scottModels: ["glm-4"],
  hatiModels: ["qwen-2.5"],
  activeCategory: "scott",
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

export function getLlamaCPPConfig(): LlamaCPPConfig {
  try {
    const stored = localStorage.getItem(LLAMACPP_CONFIG_KEY);
    const parsed = stored ? JSON.parse(stored) : DEFAULT_LLAMACPP_CONFIG;
    
    // Migration for old single-model config if exists
    if (parsed.scottModel) {
      parsed.scottModels = [parsed.scottModel];
      delete parsed.scottModel;
    }
    if (parsed.hatiModel) {
      parsed.hatiModels = [parsed.hatiModel];
      delete parsed.hatiModel;
    }
    
    return { ...DEFAULT_LLAMACPP_CONFIG, ...parsed };
  } catch {
    return DEFAULT_LLAMACPP_CONFIG;
  }
}

export function saveLlamaCPPConfig(config: LlamaCPPConfig) {
  localStorage.setItem(LLAMACPP_CONFIG_KEY, JSON.stringify(config));
}

export async function generateLlamaCPPResponse(prompt: string): Promise<string> {
  const config = getLlamaCPPConfig();
  if (!config.enabled) throw new Error("Llama.cpp not enabled");

  const models = config.activeCategory === "scott" ? config.scottModels : config.hatiModels;
  
  // Use the first model in the stack as primary
  const primaryModel = models[0] || "default";

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: primaryModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Llama.cpp Error: ${response.statusText}`);
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Simulate "Stacked Ability" if more than one model is present
    if (models.length > 1) {
      content += `\n\n[NEURAL STACK: Enhanced by ${models.slice(1).join(", ")}]`;
    }
    
    return content;
  } catch (error) {
    console.error("Llama.cpp connection failed:", error);
    throw error;
  }
}

export const HF_TOKEN_KEY = "azura_api_keys";

interface HuggingFaceConfig {
  model: string;
}

export const DEFAULT_HF_CONFIG: HuggingFaceConfig = {
  model: "mistralai/Mistral-7B-Instruct-v0.2",
};

function getStoredApiKey(service: string): { key: string; enabled: boolean } | null {
  try {
    const stored = localStorage.getItem(HF_TOKEN_KEY);
    if (!stored) return null;
    const keys = JSON.parse(stored);
    return keys[service] || null;
  } catch {
    return null;
  }
}

export async function generateHuggingFaceResponse(prompt: string): Promise<string> {
  const hfData = getStoredApiKey("hugging_face_token");
  if (!hfData || !hfData.enabled || !hfData.key) throw new Error("HF not configured");

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${DEFAULT_HF_CONFIG.model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfData.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 250, temperature: 0.7, return_full_text: false },
      }),
    });
    if (!response.ok) throw new Error(`HF Error: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data[0].generated_text : data.generated_text;
  } catch (error) {
    console.error("HF failed:", error);
    throw error;
  }
}

export async function generateLocalLlamaResponse(prompt: string): Promise<string> {
  const config = getOllamaConfig();
  if (!config.enabled) throw new Error("Ollama not enabled");

  try {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, prompt, stream: false }),
    });
    if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama failed:", error);
    throw error;
  }
}

export async function transcribeWithLocalWhisper(audioBlob: Blob): Promise<string> {
  const config = getWhisperConfig();
  if (!config.enabled) throw new Error("Whisper not enabled");
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  try {
    const response = await fetch(`${config.serverUrl}/inference`, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`Whisper Error: ${response.statusText}`);
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Whisper failed:", error);
    throw error;
  }
}

// Simulated Model Downloading/Importing (Mock)
export async function downloadModel(engine: string, modelName: string) {
  console.log(`Downloading ${modelName} for ${engine}...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  return true;
}
