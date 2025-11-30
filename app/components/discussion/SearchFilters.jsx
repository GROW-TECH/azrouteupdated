// components/discussion/SearchFilters.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

export function SearchFilters() {
  const categories = [
    { name: "Questions", count: 45 },
    { name: "Discussions", count: 32 },
    { name: "Announcements", count: 12 },
    { name: "Resources", count: 28 }
  ];

  const tags = [
    { name: "JavaScript", count: 25 },
    { name: "React", count: 18 },
    { name: "Node.js", count: 15 },
    { name: "Database", count: 12 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between cursor-pointer hover:text-primary"
              >
                <span className="text-sm">{category.name}</span>
                <Badge variant="secondary">{category.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Popular Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.name}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}