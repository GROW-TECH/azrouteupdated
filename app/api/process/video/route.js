// app/api/process/video/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import File from '@/models/File';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';

// Ensure FFmpeg is available
ffmpeg.setFfmpegPath('/path/to/ffmpeg'); // Update this path as necessary

async function downloadVideo(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const tempPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
}

async function processVideo(inputPath, fileId) {
  const qualities = [
    { name: '720p', height: 720, bitrate: '2500k' },
    { name: '480p', height: 480, bitrate: '1500k' },
    { name: '360p', height: 360, bitrate: '800k' }
  ];

  const processedUrls = {};

  for (const quality of qualities) {
    const outputFilename = path.join(os.tmpdir(), `output_${quality.name}.mp4`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          `-b:v ${quality.bitrate}`,
          `-vf scale=-2:${quality.height}`,
          '-preset medium',
          '-movflags +faststart'
        ])
        .save(outputFilename)
        .on('end', resolve)
        .on('error', reject);
    });

    const outputData = await fs.promises.readFile(outputFilename);

    const processedRef = ref(storage, `videos/processed/${fileId}/${quality.name}.mp4`);
    await uploadBytes(processedRef, outputData, {
      contentType: 'video/mp4'
    });

    const url = await getDownloadURL(processedRef);
    processedUrls[quality.name] = url;

    await fs.promises.unlink(outputFilename);
  }

  return processedUrls;
}

async function generateHLSPlaylist(processedUrls, fileId) {
  const playlist = `#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
${processedUrls['720p']}

#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
${processedUrls['480p']}

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
${processedUrls['360p']}`;

  const playlistRef = ref(storage, `videos/processed/${fileId}/playlist.m3u8`);
  await uploadBytes(playlistRef, Buffer.from(playlist), {
    contentType: 'application/vnd.apple.mpegurl'
  });

  return await getDownloadURL(playlistRef);
}

export async function POST(request) {
  let inputPath = null;

  try {
    const { fileId, originalUrl } = await request.json();

    if (!fileId || !originalUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await connectDB();

    await File.findByIdAndUpdate(fileId, {
      processedStatus: 'processing',
      updatedAt: new Date()
    });

    inputPath = await downloadVideo(originalUrl);

    const processedUrls = await processVideo(inputPath, fileId);

    const playlistUrl = await generateHLSPlaylist(processedUrls, fileId);

    await File.findByIdAndUpdate(fileId, {
      processedStatus: 'completed',
      processedUrls,
      playlistUrl,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Processing completed',
      processedUrls,
      playlistUrl
    });

  } catch (error) {
    console.error('Processing error:', error);

    if (fileId) {
      await File.findByIdAndUpdate(fileId, {
        processedStatus: 'failed',
        processingError: error.message,
        updatedAt: new Date()
      });
    }

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  } finally {
    if (inputPath && fs.existsSync(inputPath)) {
      try {
        await fs.promises.unlink(inputPath);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }
    }
  }
}
