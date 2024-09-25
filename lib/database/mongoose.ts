import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

let cached = globalThis.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async (): Promise<Mongoose> => {
  if (cached.conn) {
    return cached.conn;
  }
  if (!MONGODB_URL) throw new Error("MongoDB URL is not defined");

  cached.promise = cached.promise || mongoose.connect(MONGODB_URL, {
    dbName: 'image-ine',
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
};
