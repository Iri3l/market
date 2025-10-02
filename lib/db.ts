import mongoose from "mongoose"

const MONGO_URI = process.env.MONGO_URI as string
if (!MONGO_URI) {
  throw new Error("Missing MONGO_URI")
}

// Global cache (Next.js serverless safe pattern)
type GlobalWithMongoose = typeof globalThis & { _mongooseConn?: Promise<typeof mongoose> }
const g = globalThis as GlobalWithMongoose

export async function connectMongo() {
  if (!g._mongooseConn) {
    g._mongooseConn = mongoose.connect(MONGO_URI, {
      // @ts-expect-error Mongoose types optional
      serverSelectionTimeoutMS: 8000,
      dbName: "market",
    } as any)
  }
  return g._mongooseConn
}
