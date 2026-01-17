import {
  chatMessages,
  commandLogs,
  apiKeys,
  settings,
  type ChatMessage,
  type InsertChatMessage,
  type CommandLog,
  type InsertCommandLog,
  type ApiKey,
  type InsertApiKey,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Chat Messages
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(): Promise<void>;

  // Command Logs
  getCommandLogs(limit?: number): Promise<CommandLog[]>;
  createCommandLog(log: InsertCommandLog): Promise<CommandLog>;
  clearCommandLogs(): Promise<void>;

  // API Keys
  getApiKeys(): Promise<ApiKey[]>;
  getApiKey(service: string): Promise<ApiKey | undefined>;
  upsertApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  deleteApiKey(service: string): Promise<void>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  // Chat Messages
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async clearChatHistory(): Promise<void> {
    await db.delete(chatMessages);
  }

  // Command Logs
  async getCommandLogs(limit: number = 100): Promise<CommandLog[]> {
    return await db
      .select()
      .from(commandLogs)
      .orderBy(desc(commandLogs.timestamp))
      .limit(limit);
  }

  async createCommandLog(log: InsertCommandLog): Promise<CommandLog> {
    const [created] = await db.insert(commandLogs).values(log).returning();
    return created;
  }

  async clearCommandLogs(): Promise<void> {
    await db.delete(commandLogs);
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys);
  }

  async getApiKey(service: string): Promise<ApiKey | undefined> {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.service, service));
    return key || undefined;
  }

  async upsertApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [upserted] = await db
      .insert(apiKeys)
      .values(apiKey)
      .onConflictDoUpdate({
        target: apiKeys.service,
        set: {
          keyValue: apiKey.keyValue,
          isEnabled: apiKey.isEnabled,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async deleteApiKey(service: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.service, service));
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting || undefined;
  }

  async upsertSetting(setting: InsertSetting): Promise<Setting> {
    const [upserted] = await db
      .insert(settings)
      .values(setting)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }
}

export const storage = new DatabaseStorage();
