import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  try {
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Unable to connect to database.");
  }
}
