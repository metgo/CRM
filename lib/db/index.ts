import "reflect-metadata";
import { AppDataSource } from "./data-source";

let initialized = false;

export async function getDb() {
  if (!initialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    initialized = true;
  }
  return AppDataSource;
}

export async function getRepository<T extends object>(
  entity: new () => T
) {
  const db = await getDb();
  return db.getRepository(entity);
}

export * from "./entities";
export { AppDataSource } from "./data-source";
