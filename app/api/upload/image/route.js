// app/api/upload/image/route.js
import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { connectDB } from '@/lib/mongodb';
import File from '@/models/File';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Connect to MongoDB using the provided connection function
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileId = uuidv4();
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const filename = `${fileId}.${fileExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Firebase Storage
    const storageRef = ref(storage, `images/${filename}`);
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });
    const downloadURL = await getDownloadURL(storageRef);

    // Save metadata to MongoDB using Mongoose
    const fileDoc = new File({
      _id: fileId,
      originalName,
      filename,
      type: file.type,
      size: file.size,
      url: downloadURL,
      storageLocation: `images/${filename}`,
      fileType: 'image'
    });

    await fileDoc.save();

    return NextResponse.json({
      url: downloadURL,
      fileId,
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
