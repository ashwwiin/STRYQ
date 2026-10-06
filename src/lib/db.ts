import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stryq';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = (globalThis as any).mongooseCache;

if (!cached) {
  cached = (globalThis as any).mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose | null> {
  // 1. Instant reuse if already connected (0ms)
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // 2. Return cached instance if valid
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // 3. If a connection is already in progress, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch {
      cached.promise = null;
    }
  }

  // 4. Initiate fresh connection
  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxIdleTimeMS: 60000,
  };

  cached.promise = mongoose
    .connect(MONGODB_URI, opts)
    .then((m) => {
      cached.conn = m;
      return m;
    })
    .catch((err) => {
      console.warn('MongoDB connection notice:', err.message);
      cached.promise = null;
      cached.conn = null;
      return null;
    });

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.promise = null;
    cached.conn = null;
  }

  return cached.conn;
}

