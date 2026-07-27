import "reflect-metadata";
import { DataSource } from "typeorm";
import { Organization } from "./entities/Organization.js";
import { Profile } from "./entities/Profile.js";
import { Client } from "./entities/Client.js";
import { Contact } from "./entities/Contact.js";
import { Communication } from "./entities/Communication.js";
import { Template } from "./entities/Template.js";
import { Reminder } from "./entities/Reminder.js";
import { InitialSchema1718500000000 } from "./migrations/1718500000000-InitialSchema.js";

export const AppDataSource = new DataSource({
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
  migrations: [InitialSchema1718500000000],
  synchronize: false,
  logging: true,
});
