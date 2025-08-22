import { readFileSync } from "fs";
import { join } from "path";
import { DbSchema, type Database } from "./schema";

let cachedDb: Database | null = null;

/**
 * Reads the db.json file, validates it against the schema, and returns a typesafe Database object
 * Uses caching to avoid re-reading and re-validating on subsequent calls
 */
export function getData(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    // Read the database file
    const dbPath = join(__dirname, "..", "db", "db.json");
    const rawData = readFileSync(dbPath, "utf-8");

    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(rawData);
    } catch (parseError) {
      throw new Error(
        `Failed to parse db.json: ${
          parseError instanceof Error
            ? parseError.message
            : "Unknown JSON parse error"
        }`
      );
    }

    // Validate against schema
    const validationResult = DbSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error(
        "Database validation failed:",
        validationResult.error.format()
      );
      throw new Error(
        `Database validation failed: ${validationResult.error.message}`
      );
    }

    // Cache the validated data
    cachedDb = validationResult.data;
    return cachedDb;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load database: ${error.message}`);
    }
    throw new Error("Failed to load database: Unknown error");
  }
}

/**
 * Clears the cached database - useful for testing or when the database file changes
 */
export function clearCache(): void {
  cachedDb = null;
}
