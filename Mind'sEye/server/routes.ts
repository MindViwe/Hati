import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import aiRoutes from "./routes/ai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register AI routes
  app.use("/api/ai", aiRoutes);
  
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
