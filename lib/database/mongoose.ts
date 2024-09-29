/* eslint-disable  @typescript-eslint/no-explicit-any */
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

interface MongooseConn{
  conn:Mongoose |null;
  promise:Promise<Mongoose> |null;
}

let cached: MongooseConn=(global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose= 
  { 
    conn: null, 
    promise: null ,

  };
}

export const connectToDatabase = async () => {
  if (cached.conn) {
    console.log("Using cached connection");
    return cached.conn;
  }
  if (!MONGODB_URL) throw new Error("MongoDB URL is not defined");

  try {
    if (!cached.promise) {
      console.log("Creating new connection to MongoDB...");
      cached.promise = mongoose.connect(MONGODB_URL, {
        dbName: 'image-ine',
        bufferCommands: false,
      });
    }
    cached.conn = await cached.promise;
    console.log("MONGODB_URL:", MONGODB_URL);
    console.log("Connected to MongoDB");
    return cached.conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};