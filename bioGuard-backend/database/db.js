const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('[DB] FATAL: MONGODB_URI environment variable is not set!');
    console.error('[DB] Add MONGODB_URI to your Render Environment Variables.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000
    });
    console.log(`[DB] ✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    console.error('[DB] Check: 1) MONGODB_URI is correct  2) Atlas Network Access allows 0.0.0.0/0');
    process.exit(1);
  }
};

module.exports = connectDB;