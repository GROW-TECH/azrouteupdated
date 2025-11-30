// app/dashboard/teacher/courses/upload/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { uploadToFirebase } from '@/lib/firebase';
import { 
  Upload, 
  Loader2, 
  Plus, 
  X, 
  FileVideo,
  Image as ImageIcon,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CourseCategories } from '@/components/course-categories';

export const CATEGORIES = [
  // 'Web Development',
  // 'Mobile Development',
  // 'Data Science',
  // 'Machine Learning',
  // 'DevOps',
  // 'Cloud Computing',
  // 'Cybersecurity',
  // 'Blockchain',
  // 'Game Development',
  'Dentistry',
  'Medical',
  'Nursing',
  'Other'
];

export default function CourseUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    level: 'Beginner',
    thumbnail: null,
    prerequisites: '',
    objectives: [],
    status: 'draft'
  });

  const [sections, setSections] = useState([{
    title: '',
    lessons: [{
      title: '',
      description: '',
      videoFile: null,
      duration: '',
      resources: []
    }]
  }]);

  const [uploadProgress, setUploadProgress] = useState({
    thumbnail: 0,
    videos: {}
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          router.push('/auth/teacher/login');
          return;
        }

        const data = await res.json();
        if (data.user?.role !== 'teacher') {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/teacher/login');
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (sectionIndex, field, value) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        [field]: value
      };
      return newSections;
    });
  };

  const handleLessonChange = (sectionIndex, lessonIndex, field, value) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex].lessons[lessonIndex] = {
        ...newSections[sectionIndex].lessons[lessonIndex],
        [field]: value
      };
      return newSections;
    });
  };

  const addSection = () => {
    setSections(prev => [...prev, {
      title: '',
      lessons: [{
        title: '',
        description: '',
        videoFile: null,
        duration: '',
        resources: []
      }]
    }]);
  };

  const addLesson = (sectionIndex) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex].lessons.push({
        title: '',
        description: '',
        videoFile: null,
        duration: '',
        resources: []
      });
      return newSections;
    });
  };

  const removeSection = (sectionIndex) => {
    if (sections.length === 1) {
      toast({
        title: "Cannot remove section",
        description: "Course must have at least one section",
        variant: "destructive"
      });
      return;
    }
    setSections(prev => prev.filter((_, index) => index !== sectionIndex));
  };

  const removeLesson = (sectionIndex, lessonIndex) => {
    const section = sections[sectionIndex];
    if (section.lessons.length === 1) {
      toast({
        title: "Cannot remove lesson",
        description: "Section must have at least one lesson",
        variant: "destructive"
      });
      return;
    }
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex].lessons = newSections[sectionIndex].lessons
        .filter((_, index) => index !== lessonIndex);
      return newSections;
    });
  };

  const handleThumbnailChange = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    setCourseData(prev => ({
      ...prev,
      thumbnail: file
    }));
  };

  const handleVideoChange = async (sectionIndex, lessonIndex, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video must be less than 500MB",
        variant: "destructive"
      });
      return;
    }

    // Update the lesson with the video file
    handleLessonChange(sectionIndex, lessonIndex, 'videoFile', file);

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      handleLessonChange(sectionIndex, lessonIndex, 'duration', duration);
    };
    video.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate course data
      if (!courseData.title || !courseData.description || !courseData.price || !courseData.category) {
        throw new Error('Please fill in all required fields');
      }

      if (!courseData.thumbnail) {
        throw new Error('Please upload a course thumbnail');
      }

      // Validate sections and lessons
      if (sections.some(section => !section.title)) {
        throw new Error('All sections must have titles');
      }

      if (sections.some(section => 
        section.lessons.some(lesson => !lesson.title || !lesson.videoFile)
      )) {
        throw new Error('All lessons must have titles and video content');
      }

      // Upload thumbnail
      const thumbnailURL = await uploadToFirebase(
        courseData.thumbnail,
        'course-thumbnails',
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            thumbnail: progress
          }));
        }
      );

      // Upload videos for each lesson
      const processedSections = await Promise.all(sections.map(async (section, sIndex) => {
        const processedLessons = await Promise.all(section.lessons.map(async (lesson, lIndex) => {
          const videoURL = await uploadToFirebase(
            lesson.videoFile,
            'course-videos',
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                videos: {
                  ...prev.videos,
                  [`${sIndex}-${lIndex}`]: progress
                }
              }));
            }
          );
          
          return {
            title: lesson.title,
            description: lesson.description,
            videoUrl: videoURL,
            duration: lesson.duration,
            resources: lesson.resources
          };
        }));

        return {
          title: section.title,
          lessons: processedLessons
        };
      }));

      // Create course in database
      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...courseData,
          thumbnail: thumbnailURL,
          sections: processedSections,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create course');
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      router.push('/dashboard/teacher/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Course</h1>
          <p className="text-muted-foreground">
            Fill in the details below to create your course
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Course Info */}
            <div className="space-y-4">
              <Input
                name="title"
                value={courseData.title}
                onChange={handleChange}
                placeholder="Course Title"
                required
              />
              
              <Textarea
                name="description"
                value={courseData.description}
                onChange={handleChange}
                placeholder="Course Description"
                required
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  name="price"
                  value={courseData.price}
                  onChange={handleChange}
                  placeholder="Price per Student"
                  min="0"
                  required
                />
                
                
                  <CourseCategories
  value={courseData.category}
  onChange={(value) => setCourseData(prev => ({ ...prev, category: value }))}
/>
                  
              </div>

              <Select
                value={courseData.level}
                onValueChange={(value) => 
                  setCourseData(prev => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course Thumbnail</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleThumbnailChange(e.target.files[0])}
                  required
                />
                {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.thumbnail}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <Textarea
                name="prerequisites"
                value={courseData.prerequisites}
                onChange={handleChange}
                placeholder="Course Prerequisites (optional)"
                rows={2}
              />
            </div>

            {/* Course Content Sections */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Course Content</h3>
                <Button 
                  type="button" 
                  onClick={addSection} 
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {sections.map((section, sectionIndex) => (
                <Card key={sectionIndex} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <Input
                      value={section.title}
                      onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                      placeholder="Section Title"
                      className="max-w-md"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(sectionIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4 ml-4">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="space-y-2 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={lesson.title}
                              onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'title', e.target.value)}
                              placeholder="Lesson Title"
                              required
                            />
                            <Textarea
                              value={lesson.description}
                              onChange={(e) => handleLessonChange(sectionIndex, lessonIndex, 'description', e.target.value)}
                              placeholder="Lesson Description"
                              rows={2}
                              required
                            />
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Lesson Video</label>
                              <Input
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleVideoChange(sectionIndex, lessonIndex, e.target.files[0])}
                                required={!lesson.videoFile}
                              />
                              {uploadProgress.videos[`${sectionIndex}-${lessonIndex}`] > 0 && 
                               uploadProgress.videos[`${sectionIndex}-${lessonIndex}`] < 100 && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress.videos[`${sectionIndex}-${lessonIndex}`]}%` }}
                                  ></div>
                                </div>
                              )}
                              {lesson.duration && (
                                <p className="text-sm text-muted-foreground">
                                  Duration: {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLesson(sectionIndex, lessonIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addLesson(sectionIndex)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lesson
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Before you submit</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure all required fields are filled</li>
                  <li>Video files should be less than 500MB</li>
                  <li>Supported video formats: MP4, WebM</li>
                  <li>Course thumbnail should be less than 2MB</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadProgress.thumbnail < 100 || 
                     Object.values(uploadProgress.videos).some(progress => progress < 100)
                      ? 'Uploading...'
                      : 'Creating Course...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create Course
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );}