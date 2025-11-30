// components/courses/CourseSearch.jsx
import { Input } from "../ui/input";
import { Search } from "lucide-react";

export function CourseSearch() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search courses..."
        className="pl-10"
      />
    </div>
  );
}