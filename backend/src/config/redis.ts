import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};

// Cache helpers
export const setCache = async (key: string, value: any, ttl: number = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('❌ Redis SET error:', error);
  }
};

export const getCache = async (key: string) => {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('❌ Redis GET error:', error);
    return null;
  }
};

export const delCache = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('❌ Redis DEL error:', error);
  }
};

export const clearCache = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('❌ Redis CLEAR error:', error);
  }
};

export default redisClient;