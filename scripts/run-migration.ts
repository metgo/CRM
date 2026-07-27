import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Import entities directly
import { Organization } from "../lib/db/entities/Organization";
import { Profile } from "../lib/db/entities/Profile";
import { Client } from "../lib/db/entities/Client";
import { Contact } from "../lib/db/entities/Contact";
import { Communication } from "../lib/db/entities/Communication";
import { Template } from "../lib/db/entities/Template";
import { Reminder } from "../lib/db/entities/Reminder";

async function loadMigrations() {
  const migrationsDir = path.join(__dirname, "../lib/db/migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .sort();

  const migrations = [];
  for (const file of migrationFiles) {
    const migrationModule = await import(path.join(migrationsDir, file));
    // Get the first exported class (the migration class)
    const migrationClass = Object.values(migrationModule)[0];
    if (migrationClass) {
      migrations.push(migrationClass);
    }
  }
  return migrations;
}

async function runMigration() {
  const migrations = await loadMigrations();
  console.log(`Found ${migrations.length} migration(s)`);

  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "metgo_crm",
    entities: [
      Organization,
      Profile,
      Client,
      Contact,
      Communication,
      Template,
      Reminder,
    ],
    migrations: migrations as any[],
    synchronize: false,
    logging: true,
  });

  try {
    console.log("Initializing data source...");
    await dataSource.initialize();
    console.log("Data source initialized.");

    console.log("Running migrations...");
    const executedMigrations = await dataSource.runMigrations();
    console.log(`Executed ${executedMigrations.length} migration(s):`);
    executedMigrations.forEach((m) => console.log(`  - ${m.name}`));

    if (executedMigrations.length === 0) {
      console.log("No pending migrations to run.");
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runMigration();
