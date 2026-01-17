import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertChatMessageSchema,
  insertCommandLogSchema,
  insertApiKeySchema,
  insertSettingSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Chat Messages API
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.delete("/api/chat/messages", async (req, res) => {
    try {
      await storage.clearChatHistory();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear chat history" });
    }
  });

  // Command Logs API
  app.get("/api/commands/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getCommandLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch command logs" });
    }
  });

  app.post("/api/commands/logs", async (req, res) => {
    try {
      const validatedData = insertCommandLogSchema.parse(req.body);
      const log = await storage.createCommandLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid command log data" });
    }
  });

  app.delete("/api/commands/logs", async (req, res) => {
    try {
      await storage.clearCommandLogs();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear command logs" });
    }
  });

  // API Keys Management
  app.get("/api/keys", async (req, res) => {
    try {
      const keys = await storage.getApiKeys();
      // Don't send actual key values to frontend for security
      const sanitized = keys.map(k => ({
        ...k,
        keyValue: k.keyValue ? '***' + k.keyValue.slice(-4) : '',
      }));
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.get("/api/keys/:service", async (req, res) => {
    try {
      const key = await storage.getApiKey(req.params.service);
      if (!key) {
        return res.status(404).json({ error: "API key not found" });
      }
      // Don't send actual key value
      res.json({
        ...key,
        keyValue: key.keyValue ? '***' + key.keyValue.slice(-4) : '',
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API key" });
    }
  });

  app.post("/api/keys", async (req, res) => {
    try {
      const validatedData = insertApiKeySchema.parse(req.body);
      const key = await storage.upsertApiKey(validatedData);
      res.status(201).json({
        ...key,
        keyValue: key.keyValue ? '***' + key.keyValue.slice(-4) : '',
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid API key data" });
    }
  });

  app.delete("/api/keys/:service", async (req, res) => {
    try {
      await storage.deleteApiKey(req.params.service);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // Settings Management
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingSchema.parse(req.body);
      const setting = await storage.upsertSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  return httpServer;
}
