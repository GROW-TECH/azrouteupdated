// app/api/upload/video/route.js
import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { connectDB } from '@/lib/mongodb';
import File from '@/models/File';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file');
    const duration = parseFloat(formData.get('duration') || '0');
    console.log("duration",duration)
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are allowed.' },
        { status: 400 }
      );
    }
    
    const fileId = uuidv4();
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const filename = `${fileId}.${fileExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `videos/${filename}`);
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });
    const downloadURL = await getDownloadURL(storageRef);
    
    // Format duration to 2 decimal places
    const formattedDuration = parseFloat(duration.toFixed(2));
    
    // Save metadata to MongoDB
    const fileDoc = new File({
      _id: fileId,
      originalName,
      filename,
      type: file.type,
      size: file.size,
      url: downloadURL,
      storageLocation: `videos/${filename}`,
      fileType: 'video',
      duration: formattedDuration,
      processedStatus: 'completed',
      uploadedAt: new Date()
    });
    
    await fileDoc.save();
    
    return NextResponse.json({
      success: true,
      url: downloadURL,
      fileId,
      duration: formattedDuration,
      ...fileDoc.toObject()
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
