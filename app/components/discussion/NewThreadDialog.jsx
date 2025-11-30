// components/discussion/NewThreadDialog.jsx
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "../ui/dialog";
  import { Button } from "../ui/button";
  import { Label } from "../ui/label";
  import { Input } from "../ui/input";
  import { Textarea } from "../ui/textarea";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "../ui/select";
  
  export function NewThreadDialog({ userType }) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>New Discussion</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Start a New Discussion</DialogTitle>
            <DialogDescription>
              Create a new discussion thread. Be specific and include relevant details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter a descriptive title" />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Describe your topic in detail..."
                rows={5}
              />
            </div>
  
            {userType === 'teacher' && (
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="pin" className="rounded" />
                <Label htmlFor="pin">Pin this discussion</Label>
              </div>
            )}
  
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Create Thread</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }