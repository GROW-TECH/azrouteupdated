// app/components/VideoUploader.jsx
import React, { useState, useRef } from 'react';

const VideoUploader = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Add small timeout to ensure duration is available
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject("Error loading video file");
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);

      // Get video duration before upload
      const duration = await getVideoDuration(file);
      console.log('Video duration:', duration);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('duration', duration.toString());

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      };

      const response = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open('POST', '/api/upload/video');
        xhr.send(formData);
      });

      onUploadComplete?.(response);

    } catch (error) {
      console.error('Upload error:', error);
      // Handle error appropriately
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="video-upload"
      />
      <label
        htmlFor="video-upload"
        className="block w-full px-4 py-2 text-center border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
      >
        {uploading ? (
          <div>
            <div className="mb-2">Uploading... {progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          "Click to upload video"
        )}
      </label>
    </div>
  );
};

export default VideoUploader;