// app/dashboard/teacher/courses/[courseId]/edit/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";

// Import form components from course creation
import { BasicInfoForm, ContentForm, PricingForm } from '../../create/components';
import { use } from 'react';

// Helper function to deeply compare objects
const compareObjects = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export default function CourseEdit({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const {courseId}=use(params)

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && courseId) {
      fetchCourseData();
    }
  }, [mounted, courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/courses/${courseId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch course');

      // Set both states with the initial data
      setCourseData(data.course);
      setOriginalData(data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load course data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (field, value) => {
    setCourseData(prev => {
      const newData = { ...prev };
      
      if (field === 'sections') {
        // Handle full sections update
        newData.sections = value;
      } else if (field.startsWith('sections.')) {
        // Handle nested section/lesson updates
        const [, sectionIndex, subField, lessonIndex, lessonField] = field.match(/sections\.(\d+)\.(.+?)(?:\.(\d+)\.(.+))?$/);
        
        newData.sections = [...prev.sections];
        const section = { ...newData.sections[sectionIndex] };
        newData.sections[sectionIndex] = section;

        if (lessonIndex !== undefined) {
          // Update lesson field
          section.lessons = [...section.lessons];
          section.lessons[lessonIndex] = {
            ...section.lessons[lessonIndex],
            [lessonField]: value
          };
        } else {
          // Update section field
          section[subField] = value;
        }
      } else {
        // Handle regular field updates
        newData[field] = value;
      }
      
      return newData;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Initialize changes object
      const changes = {};

      // Compare each field and handle nested structures
      Object.keys(courseData).forEach(key => {
        // Skip id field
        if (key === 'id') return;

        // Handle sections specially
        if (key === 'sections') {
          const sectionsChanged = courseData.sections.some((section, sIndex) => {
            const originalSection = originalData.sections[sIndex];
            if (!originalSection) return true;

            // Compare section properties
            if (section.title !== originalSection.title) return true;

            // Compare lessons
            return section.lessons.some((lesson, lIndex) => {
              const originalLesson = originalSection.lessons[lIndex];
              if (!originalLesson) return true;

              return !compareObjects(lesson, originalLesson);
            });
          });

          if (sectionsChanged) {
            changes.sections = courseData.sections.map(section => ({
              ...section,
              lessons: section.lessons.map(lesson => ({
                ...lesson,
                resources: lesson.resources || []
              }))
            }));
          }
        }
        // Handle arrays (objectives, requirements)
        else if (Array.isArray(courseData[key])) {
          if (!compareObjects(courseData[key], originalData[key])) {
            changes[key] = courseData[key];
          }
        }
        // Handle primitive values and other objects
        else if (!compareObjects(courseData[key], originalData[key])) {
          changes[key] = courseData[key];
        }
      });

      // Calculate totals if sections changed
      if (changes.sections) {
        let totalDuration = 0;
        let totalLessons = 0;

        changes.sections.forEach(section => {
          totalLessons += section.lessons.length;
          section.lessons.forEach(lesson => {
            totalDuration += Number(lesson.duration) || 0;
          });
        });

        changes.totalDuration = totalDuration;
        changes.totalLessons = totalLessons;
      }

      if (Object.keys(changes).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes to save",
        });
        return;
      }

      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...changes,
          lastUpdated: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course');
      }

      // Update both states with the new data to keep them in sync
      const updatedCourse = {
        ...courseData,
        ...data.course
      };

      setCourseData(updatedCourse);
      setOriginalData(updatedCourse);

      toast({
        title: "Success",
        description: "Course updated successfully",
      });

    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle loading state
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Handle course not found
  if (!courseData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The course you're trying to edit doesn't exist or you don't have permission to access it.
        </p>
        <Button 
          onClick={() => router.push('/dashboard/teacher/courses')}
          suppressHydrationWarning
        >
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            suppressHydrationWarning
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Course</h1>
            <p className="text-muted-foreground">
              {courseData.title}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || JSON.stringify(courseData) === JSON.stringify(originalData)}
          suppressHydrationWarning
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <Tabs defaultValue="basic" className="p-6">
          <TabsList className="w-full md:w-auto" suppressHydrationWarning>
            <TabsTrigger value="basic" suppressHydrationWarning>
              Basic Information
            </TabsTrigger>
            <TabsTrigger value="content" suppressHydrationWarning>
              Course Content
            </TabsTrigger>
            <TabsTrigger value="pricing" suppressHydrationWarning>
              Pricing & Requirements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoForm
              data={courseData}
              onChange={handleDataChange}
            />
          </TabsContent>

          <TabsContent value="content">
            <ContentForm
              data={courseData}
              onChange={handleDataChange}
            />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingForm
              data={courseData}
              onChange={handleDataChange}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}