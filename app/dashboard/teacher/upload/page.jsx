"use client"
import React, { useState } from 'react';
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
import { Upload, Loader2 } from "lucide-react";

export default function CourseUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    level: 'Beginner',
    thumbnail: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(courseData).forEach(key => {
        formData.append(key, courseData[key]);
      });

      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload course');

      router.push('/dashboard/teacher/courses');
    } catch (error) {
      console.error('Error uploading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Course Title</label>
                <Input
                  name="title"
                  value={courseData.title}
                  onChange={handleChange}
                  placeholder="Enter course title"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  name="description"
                  value={courseData.description}
                  onChange={handleChange}
                  placeholder="Enter course description"
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    name="price"
                    value={courseData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Duration (in hours)</label>
                  <Input
                    type="number"
                    name="duration"
                    value={courseData.duration}
                    onChange={handleChange}
                    placeholder="Enter duration"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Level</label>
                <Select
                  name="level"
                  value={courseData.level}
                  onValueChange={(value) => 
                    setCourseData(prev => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Thumbnail</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => 
                    setCourseData(prev => ({ 
                      ...prev, 
                      thumbnail: e.target.files[0] 
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Course
                  </>
                )}
              </Button>
            </div>
          </form>
          </CardContent>
          </Card>
          </div>
  )};