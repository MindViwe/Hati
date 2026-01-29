import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerImageRoutes } from "./replit_integrations/image";
import { z } from "zod";

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

  return httpServer;
}
