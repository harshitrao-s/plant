import mongoose from "mongoose";

let memoryServer = null;
export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    await mongoose.connect(uri);
    console.log("Database: MongoDB from MONGODB_URI");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required when NODE_ENV is production.");
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();
  memoryServer = mongod;
  await mongoose.connect(mongod.getUri());
  console.log(
    "Database: in-memory MongoDB. Data is wiped when the API process stops. Set MONGODB_URI for local MongoDB or Atlas.",
  );
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
