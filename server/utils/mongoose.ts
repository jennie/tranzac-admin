import mongoose from "mongoose";

let isConnected = false;

export async function ensureConnection() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI ?? "";

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Database connected");
    return mongoose.connection;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}