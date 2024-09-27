import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

let cached = globalThis.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async (): Promise<Mongoose> => {
  if (cached.conn) {
    console.log("Using cached connection");
    return cached.conn;
  }
  if (!MONGODB_URL) throw new Error("MongoDB URL is not defined");

  try {
    if (!cached.promise) {
      console.log("Creating new connection to MongoDB...");
      cached.promise = mongoose.connect(MONGODB_URL, {
        dbName: 'Cluster0',
        bufferCommands: false,
      });
    }
    cached.conn = await cached.promise;
    console.log("Connected to MongoDB");
    return cached.conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};