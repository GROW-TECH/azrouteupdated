// app/dashboard/teacher/courses/create/components/BasicInfoForm.jsx
'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function BasicInfoForm({ data, onChange }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleThumbnailUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

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

      const response = await fetch('/api/upload', {
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
          <Label>Category</Label>
          <Select
            value={data.category || ''}
            onValueChange={(value) => onChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Entry">Entry</SelectItem>
              <SelectItem value="Mid">Mid</SelectItem>
              <SelectItem value="Advance">Advance</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
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

      <div className="space-y-2">
        <Label>Course Preview Video (Optional)</Label>
        <Input
          type="text"
          value={data.previewVideo || ''}
          onChange={(e) => onChange('previewVideo', e.target.value)}
          placeholder="Enter preview video URL"
        />
      </div>
    </div>
  );
}