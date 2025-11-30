// components/assignments/CreateAssignment.jsx
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function CreateAssignment() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Assignment Title</Label>
        <Input id="title" placeholder="Enter assignment title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web-dev">Advanced Web Development</SelectItem>
            <SelectItem value="backend">Backend Development</SelectItem>
            <SelectItem value="mobile">Mobile App Development</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter assignment description and requirements"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="points">Total Points</Label>
          <Input id="points" type="number" placeholder="100" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Submission Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select submission type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="file">File Upload</SelectItem>
            <SelectItem value="text">Text Submission</SelectItem>
            <SelectItem value="link">URL/Link</SelectItem>
            <SelectItem value="multiple">Multiple Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-4 space-x-2 flex justify-end">
        <Button variant="outline">Cancel</Button>
        <Button>Create Assignment</Button>
      </div>
    </div>
  );
}