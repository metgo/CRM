import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { Organization } from "./entities/Organization";
import { Profile } from "./entities/Profile";
import { Client } from "./entities/Client";
import { Contact } from "./entities/Contact";
import { Communication } from "./entities/Communication";
import { Template } from "./entities/Template";
import { Reminder } from "./entities/Reminder";

const baseConfig: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "pacecode",
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
  migrations: [],
  subscribers: [],
};

export const AppDataSource = new DataSource({
  ...baseConfig,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
});
