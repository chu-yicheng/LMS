import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(" 請在 .env.local 設定 MONGODB_URI");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "next_project",
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongoose) => {
        console.log("MongoDB 已連線");
        return mongoose;
      })
      .catch((err) => {
        console.error(" MongoDB 連線錯誤：", err.message);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
