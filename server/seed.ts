import { db } from "./db";
import { projects, songs } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed Projects
  const existingProjects = await db.select().from(projects);
  if (existingProjects.length === 0) {
    await db.insert(projects).values([
      {
        title: "Hello Hati",
        description: "A simple introduction project",
        code: "console.log('Hello from Hati!');",
        language: "javascript"
      },
      {
        title: "Xhosa Greeting",
        description: "A cultural greeting app",
        code: "function greet() { return 'Molo, unjani?'; }",
        language: "javascript"
      }
    ]);
    console.log("Seeded projects");
  }

  // Seed Songs
  const existingSongs = await db.select().from(songs);
  if (existingSongs.length === 0) {
    await db.insert(songs).values([
      {
        title: "Camagu",
        lyrics: "Camagu livumile\nCamagu lisavakala\nSiyabulela kwizinyanya\nNgokusikhusela usuku lonke.",
        genre: "Traditional"
      }
    ]);
    console.log("Seeded songs");
  }

  console.log("Seeding complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
