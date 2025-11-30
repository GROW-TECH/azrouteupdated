"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/components/ui/use-toast';

export function RequestCategoryDialog({ isOpen, onClose }) {
  const {toast}=useToast()
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    qualifications: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/categories/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      toast.success("Category request submitted successfully!");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request New Category</DialogTitle>
          <DialogDescription>
            Please provide details about the subject you'd like to teach.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Name</label>
            <Input
              required
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                subject: e.target.value
              }))}
              placeholder="Enter subject name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="Describe what this subject covers"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Qualifications</label>
            <Textarea
              required
              value={formData.qualifications}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                qualifications: e.target.value
              }))}
              placeholder="List your relevant qualifications and experience"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}