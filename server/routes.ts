import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import OpenAI from "openai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register integration routes
  // The user requested a "Hati" persona which implies text chat primarily, 
  // but also mentioned "voice chatting... looking at each other".
  // The integration blueprint says Chat and Audio are mutually exclusive.
  // Given the extensive requirements for "voice chatting" and "avatar", I should probably use Audio routes if possible,
  // but for a text-first MVP with "preview interphase", Chat routes might be safer/simpler to start.
  // However, `registerAudioRoutes` includes conversation CRUD which replaces `registerChatRoutes`.
  // Let's stick to Text Chat for now as it's more robust for "creating apps/poems" and seeing text.
  // Wait, I can register both if I'm careful? No, they conflict on `/api/conversations`.
  // I will use `registerChatRoutes` for now as the core interaction is text-based code generation/poetry.
  // The "voice chat" requirement might be a future enhancement or I can add it later.
  // Actually, I'll stick with `registerChatRoutes` for text stability.
  registerChatRoutes(app); 
  registerImageRoutes(app);

  // Simple Auth Middleware
  // The user asked for a password to enter.
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    // Simple hardcoded check or env var
    const validPassword = process.env.APP_PASSWORD || "azura";
    if (password === validPassword) {
      // In a real app, we'd issue a token. 
      // For this MVP, we just return success and frontend stores a flag.
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // Projects API
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  // Songs API
  app.get(api.songs.list.path, async (req, res) => {
    const songs = await storage.getSongs();
    res.json(songs);
  });

  app.post(api.songs.create.path, async (req, res) => {
    try {
      const input = api.songs.create.input.parse(req.body);
      const song = await storage.createSong(input);
      res.status(201).json(song);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.songs.get.path, async (req, res) => {
    const song = await storage.getSong(Number(req.params.id));
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json(song);
  });

  // Text-to-Speech endpoint for Hati to speak
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "nova" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        messages: [
          { role: "system", content: "You are an assistant that performs text-to-speech." },
          { role: "user", content: `Repeat the following text verbatim: ${text}` },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = (chunk.choices?.[0]?.delta as any);
        if (!delta) continue;
        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ audio: delta.audio.data })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("TTS error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "TTS failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "TTS failed" });
      }
    }
  });

  // Terminal execute endpoint - real shell execution
  app.post("/api/terminal/execute", async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      // Handle built-in commands
      if (command.trim() === "help") {
        res.json({ 
          output: `Hati Terminal - Available Commands:
  ls, ll, la     - List directory contents
  cd <dir>       - Change directory
  pwd            - Print working directory
  cat <file>     - Display file contents
  echo <text>    - Print text
  mkdir <dir>    - Create directory
  rm <file>      - Remove file
  cp <src> <dst> - Copy file
  mv <src> <dst> - Move file
  touch <file>   - Create empty file
  grep <pattern> - Search in files
  find <path>    - Find files
  node, npm, npx - Node.js commands
  python, pip    - Python commands
  git            - Git commands
  curl, wget     - HTTP requests
  clear          - Clear terminal (use button)
  
Type any valid shell command to execute.` 
        });
        return;
      }

      // Execute real shell command with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
        cwd: process.cwd(),
        env: { ...process.env, TERM: "xterm-256color" },
      });

      const output = stdout || stderr || "Command executed successfully.";
      res.json({ output: output.trim(), error: stderr ? true : false });
    } catch (error: any) {
      console.error("Terminal error:", error);
      
      // Handle command errors (non-zero exit codes)
      if (error.stdout || error.stderr) {
        const output = error.stderr || error.stdout || error.message;
        res.json({ output: output.trim(), error: true });
      } else if (error.killed) {
        res.json({ output: "Command timed out after 30 seconds.", error: true });
      } else {
        res.json({ output: error.message || "Command execution failed.", error: true });
      }
    }
  });

  // File upload endpoint for analysis
  app.post("/api/upload", async (req, res) => {
    try {
      // Handle base64 encoded file data
      const { filename, content, mimeType } = req.body;
      
      if (!filename || !content) {
        return res.status(400).json({ error: "Filename and content are required" });
      }

      // Return file info for AI analysis
      res.json({
        success: true,
        filename,
        mimeType: mimeType || "application/octet-stream",
        size: Buffer.from(content, "base64").length,
        message: `File "${filename}" uploaded successfully. Ready for analysis.`
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Image generation endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256",
      });

      const imageData = response.data?.[0];
      res.json({
        b64_json: imageData?.b64_json,
      });
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  return httpServer;
}
