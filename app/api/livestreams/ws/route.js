//app/api/livestreams/ws/route.js

import { NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import jwt from 'jsonwebtoken';
import { LiveStream } from '@/models/LiveStream';
import { connectDB } from '@/lib/mongodb';

const wss = new WebSocketServer({ noServer: true });
const rooms = new Map(); // streamId -> Set of WebSocket connections

export function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const streamId = searchParams.get('streamId');

  if (!token || !streamId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Verify token
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    // Upgrade the connection to WebSocket
    if (req.headers.get('upgrade') !== 'websocket') {
      return new Response('Invalid WebSocket upgrade', { status: 400 });
    }

    const { socket, response } = req.socket.server.upgrade(req);
    
    // Initialize WebSocket connection
    handleWebSocket(socket, user, streamId);
    
    return response;

  } catch (error) {
    console.error('WebSocket connection error:', error);
    return new Response('Unauthorized', { status: 401 });
  }
}

function handleWebSocket(ws, user, streamId) {
  // Add connection to room
  if (!rooms.has(streamId)) {
    rooms.set(streamId, new Set());
  }
  rooms.get(streamId).add(ws);

  // Attach user data to socket
  ws.userData = {
    id: user.id,
    role: user.role,
    name: user.name
  };

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'chat':
          // Store chat message in database
          await connectDB();
          await LiveStream.updateOne(
            { _id: streamId },
            {
              $push: {
                chat: {
                  userId: user.id,
                  userName: user.name,
                  userRole: user.role,
                  message: message.content,
                  timestamp: new Date()
                }
              },
              $inc: { 'statistics.totalInteractions': 1 }
            }
          );

          // Broadcast to all participants
          broadcast(streamId, {
            type: 'chat',
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            message: message.content,
            timestamp: new Date()
          });
          break;

        case 'raiseHand':
          broadcast(streamId, {
            type: 'handRaised',
            userId: user.id,
            userName: user.name
          });
          break;

        case 'reaction':
          broadcast(streamId, {
            type: 'reaction',
            userId: user.id,
            reaction: message.reaction
          });
          break;

        case 'status':
          // Update participant status (e.g., camera, mic)
          const connections = rooms.get(streamId);
          for (const conn of connections) {
            if (conn !== ws && conn.readyState === 1) {
              conn.send(JSON.stringify({
                type: 'participantStatus',
                userId: user.id,
                status: message.status
              }));
            }
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    const connections = rooms.get(streamId);
    if (connections) {
      connections.delete(ws);
      
      // Notify others about departure
      broadcast(streamId, {
        type: 'participantLeft',
        userId: user.id
      });

      // Clean up empty rooms
      if (connections.size === 0) {
        rooms.delete(streamId);
      }
    }
  });

  // Send initial room state
  const connections = rooms.get(streamId);
  const participants = Array.from(connections).map(conn => ({
    id: conn.userData.id,
    name: conn.userData.name,
    role: conn.userData.role
  }));

  ws.send(JSON.stringify({
    type: 'roomState',
    participants
  }));

  // Notify others about new participant
  broadcast(streamId, {
    type: 'participantJoined',
    userId: user.id,
    userName: user.name,
    userRole: user.role
  }, ws);
}

// Broadcast message to all connections in a room
function broadcast(streamId, message, excludeWs = null) {
  const connections = rooms.get(streamId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  for (const conn of connections) {
    if (conn !== excludeWs && conn.readyState === 1) {
      conn.send(messageStr);
    }
  }
}

// Handle server shutdown
process.on('SIGTERM', () => {
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
