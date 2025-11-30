// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';
// import jwt from 'jsonwebtoken';
// import Redis from 'ioredis';
// import { connectDB } from '@/lib/mongodb';
// import Student from '@/models/Student';
// import Teacher from '@/models/Teacher';

// const REDIS_CHANNEL_PREFIX = 'livestream:';

// // Initialize Redis client
// const redis = new Redis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: 3,
//   retryStrategy(times) {
//     const delay = Math.min(times * 100, 2000);
//     return delay;
//   },
//   enableReadyCheck: true
// });

// redis.on('error', (err) => {
//   console.error('Redis client error:', err);
// });

// redis.on('connect', () => {
//   console.log('Redis client connected');
// });

// // ICE Server configuration
// const ICE_SERVERS = [
//   { urls: 'stun:stun.l.google.com:19302' }
// ];

// if (process.env.TURN_SERVER) {
//   ICE_SERVERS.push({
//     urls: process.env.TURN_SERVER,
//     username: process.env.TURN_USERNAME,
//     credential: process.env.TURN_CREDENTIAL
//   });
// }

// async function verifyAuth() {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get('auth-token');

//     if (!token) {
//       return null;
//     }

//     const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
//     const UserModel = decoded.role === 'teacher' ? Teacher : Student;
    
//     await connectDB();
//     const user = await UserModel.findById(decoded.userId).select('-password');

//     if (!user) return null;

//     return {
//       id: user._id.toString(),
//       name: user.name,
//       role: decoded.role
//     };
//   } catch (error) {
//     console.error('Auth verification error:', error);
//     return null;
//   }
// }

// export async function POST(req) {
//   try {
//     const user = await verifyAuth();
//     if (!user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { streamId, type, offer, answer, candidate, targetId } = await req.json();
//     const redisChannel = `${REDIS_CHANNEL_PREFIX}${streamId}`;

//     switch (type) {
//       case 'host-ready': {
//         if (user.role !== 'teacher') {
//           return NextResponse.json(
//             { error: 'Only teachers can host streams' },
//             { status: 403 }
//           );
//         }

//         await redis.multi()
//           .hset(
//             `${redisChannel}:host`,
//             'id', user.id,
//             'name', user.name
//           )
//           .expire(`${redisChannel}:host`, 24 * 60 * 60)
//           .exec();

//         return NextResponse.json({
//           iceServers: ICE_SERVERS
//         });
//       }

//       case 'join': {
//         const host = await redis.hgetall(`${redisChannel}:host`);
//         if (!host.id) {
//           return NextResponse.json(
//             { error: 'Stream not found' },
//             { status: 404 }
//           );
//         }

//         await redis.hset(
//           `${redisChannel}:participants`,
//           user.id,
//           JSON.stringify({
//             id: user.id,
//             name: user.name,
//             role: user.role,
//             joinedAt: Date.now()
//           })
//         );

//         return NextResponse.json({
//           iceServers: ICE_SERVERS,
//           hostId: host.id
//         });
//       }

//       case 'offer': {
//         if (user.role !== 'teacher') {
//           return NextResponse.json(
//             { error: 'Unauthorized' },
//             { status: 403 }
//           );
//         }

//         await redis.set(
//           `${redisChannel}:offer`,
//           JSON.stringify(offer),
//           'EX',
//           24 * 60 * 60
//         );

//         return NextResponse.json({ success: true });
//       }

//       case 'answer': {
//         await redis.publish(
//           `${redisChannel}:signal:${targetId}`,
//           JSON.stringify({
//             type: 'answer',
//             from: user.id,
//             answer
//           })
//         );

//         return NextResponse.json({ success: true });
//       }

//       case 'candidate': {
//         await redis.publish(
//           `${redisChannel}:signal:${targetId}`,
//           JSON.stringify({
//             type: 'candidate',
//             from: user.id,
//             candidate
//           })
//         );

//         return NextResponse.json({ success: true });
//       }

//       case 'leave': {
//         await redis.hdel(`${redisChannel}:participants`, user.id);
        
//         await redis.publish(
//           `${redisChannel}:events`,
//           JSON.stringify({
//             type: 'participant-left',
//             participantId: user.id
//           })
//         );

//         return NextResponse.json({ success: true });
//       }

//       default:
//         return NextResponse.json(
//           { error: 'Invalid signal type' },
//           { status: 400 }
//         );
//     }
//   } catch (error) {
//     console.error('WebRTC signaling error:', error);
//     return NextResponse.json(
//       { error: 'Internal Server Error' },
//       { status: 500 }
//     );
//   }
// }
