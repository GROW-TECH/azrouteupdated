// app/api/webrtc/poll/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const REDIS_CHANNEL_PREFIX = 'livestream:';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('streamId');
    
    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID required' },
        { status: 400 }
      );
    }

    const redisChannel = `${REDIS_CHANNEL_PREFIX}${streamId}`;
    
    // Get pending signals for the client
    const signals = await redis.lrange(`${redisChannel}:signals`, 0, -1);
    
    // Clear the signals after retrieving them
    if (signals.length > 0) {
      await redis.del(`${redisChannel}:signals`);
    }

    return NextResponse.json(signals.map(signal => JSON.parse(signal)));

  } catch (error) {
    console.error('Signal polling error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
