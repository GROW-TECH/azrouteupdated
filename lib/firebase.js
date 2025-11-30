// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase if it hasn't been initialized
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Get Firebase Storage instance
const storage = getStorage();

/**
 * Upload a file to Firebase Storage with progress tracking
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'courses/videos')
 * @param {function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - Download URL of the uploaded file
 */
export async function uploadToFirebase(file, path, progressCallback = null) {
  if (!file) return null;
  
  // Create a storage reference
  const fileRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
  console.log("filref",fileRef)
  
  try {
    // Create upload task
    const uploadTask = uploadBytesResumable(fileRef, file);

    // Return promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = 
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Call progress callback if provided
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        // Handle errors
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        // Handle successful upload
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error starting upload:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {string} url - The download URL of the file to delete
 */
export async function deleteFromFirebase(url) {
  if (!url) return;

  try {
    // Create a reference from the download URL
    const fileRef = ref(storage, url);
    
    // Delete the file
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Upload multiple files to Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} path - The storage path
 * @param {function} progressCallback - Optional callback for overall progress
 * @returns {Promise<string[]>} - Array of download URLs
 */
export async function uploadMultipleToFirebase(files, path, progressCallback = null) {
  const uploadPromises = files.map((file, index) => {
    return uploadToFirebase(file, path, (progress) => {
      if (progressCallback) {
        // Calculate overall progress
        const overallProgress = 
          files.reduce((acc, _, i) => {
            return acc + (i === index ? progress : 0);
          }, 0) / files.length;
        
        progressCallback(overallProgress);
      }
    });
  });

  return Promise.all(uploadPromises);
}

// Export storage instance for direct access if needed
export { storage };
