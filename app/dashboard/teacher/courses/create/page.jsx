// app/dashboard/teacher/courses/create/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useToast } from "@/app/components/ui/use-toast";
import { Badge } from "@/app/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  X,
  Globe,
  Loader2,
  Video,
  FileText,
  Check,
  AlertCircle,
  DollarSign
} from "lucide-react";

const STEPS = [
  { id: 'basics', title: 'Basic Information', description: 'Course details and overview' },
  { id: 'content', title: 'Course Content', description: 'Add sections and lessons' },
  { id: 'pricing', title: 'Pricing & Requirements', description: 'Set pricing and prerequisites' },
  { id: 'review', title: 'Review & Publish', description: 'Preview and publish your course' }
];

// Basic Information Form Component
function BasicInfoForm({ data, onChange }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleThumbnailUpload = async (file) => {
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
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      onChange('thumbnail', url);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload thumbnail",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file) => {
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
    
    // Validate file size (max 100MB for intro video)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      onChange('introVideo', url);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Course Title</Label>
        <Input
          id="title"
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Enter course title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Course Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe your course"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Level</Label>
          <Select
            value={data.level || ''}
            onValueChange={(value) => onChange('level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Course Thumbnail</Label>
        <div className="flex items-center space-x-4">
          {data.thumbnail ? (
            <div className="relative w-40 h-24">
              <img
                src={data.thumbnail}
                alt="Course thumbnail"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={() => onChange('thumbnail', '')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="w-40 h-24 bg-muted flex items-center justify-center rounded-lg">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('thumbnail-upload').click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Thumbnail
                  </>
                )}
              </Button>
              <input
                type="file"
                id="thumbnail-upload"
                accept="image/*"
                onChange={(e) => handleThumbnailUpload(e.target.files[0])}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                Recommended size: 1280x720px (16:9)
              </p>
            </div>
          </div>
        </div>
      </div>
     
    </div>
  );
}

// Course Content Form Component within create/page.jsx

function ContentForm({ data, onChange, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const { toast } = useToast();

  const handleVideoUpload = async (file, sectionIndex, lessonIndex) => {
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

    // Validate file size (max 500MB)
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url, duration } = await response.json();

      // Update lesson data with video URL and duration
      const newSections = [...data.sections];
      newSections[sectionIndex].lessons[lessonIndex] = {
        ...newSections[sectionIndex].lessons[lessonIndex],
        videoUrl: url,
        duration
      };
      onChange('sections', newSections);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
    const addSection = () => {
      const newSections = [...(data.sections || []), {
        title: '',
        description: '',
        lessons: []
      }];
      onChange('sections', newSections);
    };
  
    const addLesson = (sectionIndex) => {
      const newSections = [...data.sections];
      newSections[sectionIndex].lessons.push({
        title: '',
        description: '',
        videoUrl: '',
        duration: 0,
        resources: []
      });
      onChange('sections', newSections);
    };
  
    const removeSection = (index) => {
      const newSections = [...data.sections];
      newSections.splice(index, 1);
      onChange('sections', newSections);
    };
  
    const removeLesson = (sectionIndex, lessonIndex) => {
      const newSections = [...data.sections];
      newSections[sectionIndex].lessons.splice(lessonIndex, 1);
      onChange('sections', newSections);
    };
  
    const updateSection = (index, field, value) => {
      const newSections = [...data.sections];
      newSections[index] = {
        ...newSections[index],
        [field]: value
      };
      onChange('sections', newSections);
    };
  
    const updateLesson = (sectionIndex, lessonIndex, field, value) => {
      const newSections = [...data.sections];
      newSections[sectionIndex].lessons[lessonIndex] = {
        ...newSections[sectionIndex].lessons[lessonIndex],
        [field]: value
      };
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
  
    return (
      <div className="space-y-8">
        {data.sections?.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="relative">
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2"
              onClick={() => removeSection(sectionIndex)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <CardHeader>
              <CardTitle>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  placeholder="Section Title"
                  className="text-lg font-semibold"
                />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {section.lessons.map((lesson, lessonIndex) => (
                <div key={lessonIndex} className="relative border rounded-lg p-4">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2"
                    onClick={() => removeLesson(sectionIndex, lessonIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
  
                  <div className="space-y-4">
                    <Input
                      value={lesson.title}
                      onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                      placeholder="Lesson Title"
                    />
  
                    <Textarea
                      value={lesson.description}
                      onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'description', e.target.value)}
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
                            onClick={() => updateLesson(sectionIndex, lessonIndex, 'videoUrl', '')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-40 h-24 bg-muted flex items-center justify-center rounded-lg">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          id={`video-upload-${sectionIndex}-${lessonIndex}`}
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(e.target.files[0], sectionIndex, lessonIndex)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading}
                          onClick={() => document.getElementById(`video-upload-${sectionIndex}-${lessonIndex}`).click()}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Video
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Maximum size: 500MB
                        </p>
                      </div>
                    </div>
  
                    {/* Resources Section */}
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
                            onClick={() => {
                              const newSections = [...data.sections];
                              newSections[sectionIndex].lessons[lessonIndex].resources.splice(resourceIndex, 1);
                              onChange('sections', newSections);
                            }}
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
                className="w-full"
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


// Pricing & Requirements Form Component within create/page.jsx

function PricingForm({ data, onChange }) {
    const addRequirement = () => {
      onChange('requirements', [...(data.requirements || []), '']);
    };
  
    const removeRequirement = (index) => {
      const newRequirements = [...data.requirements];
      newRequirements.splice(index, 1);
      onChange('requirements', newRequirements);
    };
  
    const updateRequirement = (index, value) => {
      const newRequirements = [...data.requirements];
      newRequirements[index] = value;
      onChange('requirements', newRequirements);
    };
  
    const addObjective = () => {
      onChange('objectives', [...(data.objectives || []), '']);
    };
  
    const removeObjective = (index) => {
      const newObjectives = [...data.objectives];
      newObjectives.splice(index, 1);
      onChange('objectives', newObjectives);
    };
  
    const updateObjective = (index, value) => {
      const newObjectives = [...data.objectives];
      newObjectives[index] = value;
      onChange('objectives', newObjectives);
    };
  
    return (
      <div className="space-y-8">
        {/* Pricing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (£)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={data.price || ''}
                    onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-9"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
  
              <div className="space-y-2">
                <Label>Discounted Price (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={data.discountedPrice || ''}
                    onChange={(e) => onChange('discountedPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-9"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  
        {/* Requirements Section */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.requirements?.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={requirement}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  placeholder="Enter a requirement"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRequirement(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addRequirement}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </CardContent>
        </Card>
  
        {/* Learning Objectives Section */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Objectives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.objectives?.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder="Enter a learning objective"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addObjective}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Learning Objective
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

// Review & Publish Form Component within create/page.jsx

function ReviewForm({ data, onPublish, publishing }) {
  const { toast } = useToast();
  
  const validateCourse = () => {
    const errors = [];

    // Basic validation
    if (!data.title?.trim()) errors.push('Course title is required');
    if (!data.description?.trim()) errors.push('Course description is required');
    if (!data.category?.trim()) errors.push('Course category is required');
    if (!data.level?.trim()) errors.push('Course level is required');
    if (!data.thumbnail?.trim()) errors.push('Course thumbnail is required');
    
    // Price validation
    if (typeof data.price !== 'number' || data.price <= 0) {
      errors.push('Valid course price is required');
    }
    
    // Sections validation
    if (!Array.isArray(data.sections) || data.sections.length === 0) {
      errors.push('At least one section is required');
    } else {
      data.sections.forEach((section, sIndex) => {
        if (!section.title?.trim()) {
          errors.push(`Section ${sIndex + 1} title is required`);
        }
        if (!Array.isArray(section.lessons) || section.lessons.length === 0) {
          errors.push(`Section ${sIndex + 1} must have at least one lesson`);
        } else {
          section.lessons.forEach((lesson, lIndex) => {
            if (!lesson.title?.trim()) {
              errors.push(`Lesson ${lIndex + 1} in Section ${sIndex + 1} title is required`);
            }
            if (!lesson.videoUrl?.trim()) {
              errors.push(`Lesson ${lIndex + 1} in Section ${sIndex + 1} video is required`);
            }
          });
        }
      });
    }

    // Learning objectives validation
    if (!Array.isArray(data.objectives) || data.objectives.length === 0) {
      errors.push('At least one learning objective is required');
    } else {
      data.objectives.forEach((objective, index) => {
        if (!objective?.trim()) {
          errors.push(`Learning objective ${index + 1} cannot be empty`);
        }
      });
    }

    return errors;
  };

  const handlePublish = async () => {
    console.log("clicked")
    try {
      const errors = validateCourse();
      console.log("error at handle publish",errors)
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: (
            <ul className="list-disc pl-4">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          ),
          variant: "destructive",
        });
        return;
      }

      // Call the onPublish function
      await onPublish();
      
    } catch (error) {
      console.error('Error during publication:', error);
      toast({
        title: "Publication Error",
        description: "An error occurred while publishing the course. Please try again.",
        variant: "destructive",
      });
    }
  };

  
    return (
      <div className="space-y-8">
        {/* Course Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Course Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <img
                  src={data.thumbnail}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              </div>
  
              <div>
                <h2 className="text-2xl font-bold">{data.title}</h2>
                <p className="text-muted-foreground mt-2">{data.description}</p>
              </div>
  
              <div className="flex items-center space-x-4">
                <Badge>{data.category}</Badge>
                <Badge variant="outline">{data.level}</Badge>
                <div className="text-sm text-muted-foreground">
                  {data.sections?.reduce((total, section) => 
                    total + section.lessons.length, 0)} lessons
                </div>
              </div>
  
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What You'll Learn</h3>
                <div className="grid grid-cols-2 gap-2">
                  {data.objectives?.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>{objective}</span>
                    </div>
                  ))}
                </div>
              </div>
  
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Requirements</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {data.requirements?.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
  
              <div className="space-y-4">
              <h3 className="text-lg font-semibold">Course Content</h3>
              <div className="space-y-4">
                {data.sections?.map((section, sectionIndex) => (
                  <Card key={sectionIndex}>
                    <CardHeader>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lessonIndex}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center space-x-3">
                              <Video className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{lesson.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')} mins
                                </div>
                              </div>
                            </div>
                            {lesson.resources?.length > 0 && (
                              <Badge variant="outline">
                                {lesson.resources.length} resources
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">
                  £{data.price}
                </div>
                {data.discountedPrice > 0 && data.discountedPrice < data.price && (
                  <>
                    <div className="text-2xl text-muted-foreground line-through">
                      £{data.discountedPrice}
                    </div>
                    <Badge variant="secondary">
                      {Math.round(((data.price - data.discountedPrice) / data.price) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish Options */}
      <Card>
          <CardHeader>
          </CardHeader>
          <CardContent className="space-y-4">
           

            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish Course
                </>
              )}
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}

// Main Course Creation Component Export
export default function CourseCreation() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    thumbnail: '',
    introVideo: '',
    sections: [],
    price: 0,
    discountedPrice: 0,
    requirements: [],
    objectives: []
  });

  // Add useEffect to handle client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDataChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePublish = async () => {
    console.log("handlepublush")
    try {
      setPublishing(true);

      const response = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      toast({
        title: "Success",
        description: "Course submitted for review successfully",
      });

      router.push('/dashboard/teacher/courses');

    } catch (error) {
      console.error('Error publishing course:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" suppressHydrationWarning>
      {isClient && (
        <>
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/teacher/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>

          <div className="space-y-8">
            {/* Steps Progress */}
            <nav aria-label="Progress">
              <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                {STEPS.map((step, index) => (
                  <li key={step.id} className="md:flex-1">
                    <div
                      className={`group flex flex-col border rounded-lg py-2 px-4 hover:bg-muted/50 ${
                        currentStep === index ? 'border-primary' : 'border-muted'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        Step {index + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {step.title}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Step Content */}
            <div className="mt-8">
              {currentStep === 0 && (
                <BasicInfoForm
                  data={courseData}
                  onChange={handleDataChange}
                />
              )}
              {currentStep === 1 && (
                <ContentForm
                  data={courseData}
                  onChange={handleDataChange}
                />
              )}
              {currentStep === 2 && (
                <PricingForm
                  data={courseData}
                  onChange={handleDataChange}
                />
              )}
              {currentStep === 3 && (
                <ReviewForm
                  data={courseData}
                  onPublish={handlePublish}
                  publishing={publishing}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}