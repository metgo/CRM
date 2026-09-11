import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { Organization } from "./entities/Organization";
import { Profile } from "./entities/Profile";
import { Client } from "./entities/Client";
import { Contact } from "./entities/Contact";
import { MC_ENTITIES } from "./entities/mc";

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
    ...MC_ENTITIES,
  ],
  migrations: [],
  subscribers: [],
};

export const AppDataSource = new DataSource({
  ...baseConfig,
  // Schema is owned by migrations (yarn migration:run). Auto-synchronize is off
  // so the metgo-crm tables and the altered clients/contacts columns are only
  // ever changed through a reviewed migration.
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
});
