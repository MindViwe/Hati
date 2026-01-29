import { useState, useRef, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "stopped";

export function useVoiceRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(100);
    setState("recording");
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        resolve(new Blob());
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setState("stopped");
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const reset = useCallback(() => {
    setState("idle");
  }, []);

  return { state, startRecording, stopRecording, reset };
}

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const isInitializedRef = useRef(false);

  const init = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    const ctx = new AudioContext({ sampleRate: 24000 });
    await ctx.audioWorklet.addModule("/audio-playback-worklet.js");
    const worklet = new AudioWorkletNode(ctx, "audio-playback-processor");
    worklet.connect(ctx.destination);
    
    worklet.port.onmessage = (e) => {
      if (e.data.type === "ended") setIsSpeaking(false);
    };
    
    audioContextRef.current = ctx;
    workletNodeRef.current = worklet;
    isInitializedRef.current = true;
  }, []);

  const speak = useCallback(async (text: string) => {
    await init();
    
    if (!workletNodeRef.current || !audioContextRef.current) return;
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    
    setIsSpeaking(true);
    
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
      });
      
      if (!res.ok) throw new Error("TTS failed");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.audio) {
              // Decode base64 PCM16 to Float32
              const raw = atob(event.audio);
              const bytes = new Uint8Array(raw.length);
              for (let i = 0; i < raw.length; i++) {
                bytes[i] = raw.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768;
              }
              workletNodeRef.current?.port.postMessage({ type: "audio", samples: float32 });
            }
            if (event.done) {
              workletNodeRef.current?.port.postMessage({ type: "streamComplete" });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    }
  }, [init]);

  const stop = useCallback(() => {
    workletNodeRef.current?.port.postMessage({ type: "clear" });
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}
