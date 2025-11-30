// lib/mongodb.js
import mongoose from 'mongoose';

// Check for required environment variable
if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null
  };
}

export async function connectDB() {
  // If we have a connection, return it
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  // If no existing promise to connect, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts);
  }

  try {
    // Await the connection
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully');
    
    // Setup connection error handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cached.promise = null;
      cached.conn = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Clearing cache...');
      cached.promise = null;
      cached.conn = null;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Reset the promise and connection on error
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
