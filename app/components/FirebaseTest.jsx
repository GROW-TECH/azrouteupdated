// components/FirebaseTest.jsx
"use client";

import { useState } from 'react';
import { uploadToFirebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export function FirebaseTest() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToFirebase(
        file, 
        'test-uploads',
        (progress) => setProgress(progress)
      );
      setDownloadURL(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Firebase Storage Test</h2>
      
      <div>
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading: {progress.toFixed(1)}%</span>
        </div>
      )}

      {downloadURL && (
        <div className="break-all">
          <p className="font-medium">Download URL:</p>
          <p className="text-sm text-muted-foreground">{downloadURL}</p>
        </div>
      )}
    </div>
  );
}