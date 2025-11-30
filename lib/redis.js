// lib/redis.js
import { Redis } from 'ioredis';

// Configure Redis client
const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  throw new Error('REDIS_URL is not defined in environment variables');
};

// Create Redis client with configuration
const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 50, 2000);
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Handle Redis events
redis.on('connect', () => {
  console.log('Redis client connected');
});

redis.on('error', (error) => {
  console.error('Redis Client Error:', error);
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

// Helper functions for common Redis operations
export async function setWithExpiry(key, value, expirySeconds) {
  try {
    await redis.setex(key, expirySeconds, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (error) {
    console.error('Redis setWithExpiry error:', error);
    throw error;
  }
}

export async function get(key) {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Redis get error:', error);
    throw error;
  }
}

export async function del(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis del error:', error);
    throw error;
  }
}

export async function publish(channel, message) {
  try {
    await redis.publish(channel, typeof message === 'string' ? message : JSON.stringify(message));
  } catch (error) {
    console.error('Redis publish error:', error);
    throw error;
  }
}

export async function subscribe(channel, callback) {
  try {
    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      try {
        callback(JSON.parse(message));
      } catch {
        callback(message);
      }
    });
    return subscriber;
  } catch (error) {
    console.error('Redis subscribe error:', error);
    throw error;
  }
}

// Cleanup function for graceful shutdown
export async function closeConnection() {
  try {
    await redis.quit();
  } catch (error) {
    console.error('Redis close error:', error);
    redis.disconnect();
  }
}

export default redis;

