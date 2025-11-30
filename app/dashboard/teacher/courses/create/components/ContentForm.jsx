// app/dashboard/teacher/courses/create/components/ContentForm.jsx

'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X, Upload, Video, Loader2 } from "lucide-react";

export function ContentForm({ data, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [currentUploadSection, setCurrentUploadSection] = useState(null);
  const [currentUploadLesson, setCurrentUploadLesson] = useState(null);
  const { toast } = useToast();

  const handleVideoUpload = async (file, sectionIndex, lessonIndex) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 500MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      setCurrentUploadSection(sectionIndex);
      setCurrentUploadLesson(lessonIndex);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url, duration } = await response.json();

      const newSections = [...data.sections];
      newSections[sectionIndex].lessons[lessonIndex] = {
        ...newSections[sectionIndex].lessons[lessonIndex],
        videoUrl: url,
        duration
      };
      onChange('sections', newSections);

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setCurrentUploadSection(null);
      setCurrentUploadLesson(null);
    }
  };

  const addSection = () => {
    const newSections = [...(data.sections || []), {
      title: '',
      order: (data.sections?.length || 0) + 1,
      lessons: [{
        title: '',
        description: '',
        videoUrl: '',
        duration: 0,
        resources: [],
        order: 1
      }]
    }];
    onChange('sections', newSections);
  };

  const addLesson = (sectionIndex) => {
    const newSections = [...data.sections];
    const currentLessons = newSections[sectionIndex].lessons;
    newSections[sectionIndex].lessons.push({
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      resources: [],
      order: (currentLessons.length || 0) + 1
    });
    onChange('sections', newSections);
  };

  const removeSection = (index) => {
    if (data.sections.length === 1) {
      toast({
        title: "Cannot remove section",
        description: "Course must have at least one section",
        variant: "destructive"
      });
      return;
    }
    const newSections = data.sections.filter((_, i) => i !== index);
    onChange('sections', newSections);
  };

  const removeLesson = (sectionIndex, lessonIndex) => {
    const section = data.sections[sectionIndex];
    if (section.lessons.length === 1) {
      toast({
        title: "Cannot remove lesson",
        description: "Section must have at least one lesson",
        variant: "destructive"
      });
      return;
    }
    const newSections = [...data.sections];
    newSections[sectionIndex].lessons = section.lessons.filter((_, i) => i !== lessonIndex);
    onChange('sections', newSections);
  };

  const addResource = (sectionIndex, lessonIndex) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].lessons[lessonIndex].resources.push({
      title: '',
      type: 'link',
      url: ''
    });
    onChange('sections', newSections);
  };

  const removeResource = (sectionIndex, lessonIndex, resourceIndex) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].lessons[lessonIndex].resources.splice(resourceIndex, 1);
    onChange('sections', newSections);
  };

  return (
    <div className="space-y-6">
      {(data.sections || []).map((section, sectionIndex) => (
        <Card key={sectionIndex} className="relative">
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2"
            onClick={() => removeSection(sectionIndex)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center">
                {sectionIndex + 1}
              </div>
              <Input
                value={section.title}
                onChange={(e) => {
                  const newSections = [...data.sections];
                  newSections[sectionIndex].title = e.target.value;
                  onChange('sections', newSections);
                }}
                placeholder="Section Title"
                className="text-lg font-semibold"
              />
            </div>

            {section.lessons.map((lesson, lessonIndex) => (
              <div key={lessonIndex} className="border rounded-lg p-4 relative ml-8">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2"
                  onClick={() => removeLesson(sectionIndex, lessonIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {lessonIndex + 1}
                    </div>
                    <Input
                      value={lesson.title}
                      onChange={(e) => {
                        const newSections = [...data.sections];
                        newSections[sectionIndex].lessons[lessonIndex].title = e.target.value;
                        onChange('sections', newSections);
                      }}
                      placeholder="Lesson Title"
                    />
                  </div>

                  <Textarea
                    value={lesson.description}
                    onChange={(e) => {
                      const newSections = [...data.sections];
                      newSections[sectionIndex].lessons[lessonIndex].description = e.target.value;
                      onChange('sections', newSections);
                    }}
                    placeholder="Lesson Description"
                    rows={2}
                  />

                  <div className="flex items-center space-x-4">
                    {lesson.videoUrl ? (
                      <div className="relative w-40 h-24">
                        <video
                          src={lesson.videoUrl}
                          className="w-full h-full object-cover rounded-lg"
                          controls
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2"
                          onClick={() => {
                            const newSections = [...data.sections];
                            newSections[sectionIndex].lessons[lessonIndex].videoUrl = '';
                            newSections[sectionIndex].lessons[lessonIndex].duration = 0;
                            onChange('sections', newSections);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-40 h-24 bg-muted flex items-center justify-center rounded-lg">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoUpload(e.target.files[0], sectionIndex, lessonIndex)}
                        disabled={uploading}
                        className="hidden"
                        id={`video-upload-${sectionIndex}-${lessonIndex}`}
                      />
                      <Label 
                        htmlFor={`video-upload-${sectionIndex}-${lessonIndex}`} 
                        className="cursor-pointer"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById(`video-upload-${sectionIndex}-${lessonIndex}`).click()}
                          disabled={uploading && currentUploadSection === sectionIndex && currentUploadLesson === lessonIndex}
                        >
                          {uploading && currentUploadSection === sectionIndex && currentUploadLesson === lessonIndex ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {lesson.videoUrl ? 'Replace Video' : 'Upload Video'}
                            </>
                          )}
                        </Button>
                      </Label>
                      {lesson.duration > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Duration: {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Resources</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addResource(sectionIndex, lessonIndex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>
                    {lesson.resources?.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="flex items-center space-x-2">
                        <Select
                          value={resource.type}
                          onValueChange={(value) => {
                            const newSections = [...data.sections];
                            newSections[sectionIndex].lessons[lessonIndex].resources[resourceIndex].type = value;
                            onChange('sections', newSections);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={resource.title}
                          onChange={(e) => {
                            const newSections = [...data.sections];
                            newSections[sectionIndex].lessons[lessonIndex].resources[resourceIndex].title = e.target.value;
                            onChange('sections', newSections);
                          }}
                          placeholder="Resource Title"
                        />
                        <Input
                          value={resource.url}
                          onChange={(e) => {
                            const newSections = [...data.sections];
                            newSections[sectionIndex].lessons[lessonIndex].resources[resourceIndex].url = e.target.value;
                            onChange('sections', newSections);
                          }}
                          placeholder="URL or Link"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResource(sectionIndex, lessonIndex, resourceIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => addLesson(sectionIndex)}
              className="w-full mt-4 ml-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>
    </div>
  );
}