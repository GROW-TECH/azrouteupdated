// components/courses/CourseFilters.jsx
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export function CourseFilters() {
  const categories = [
    "Development",
    "Business",
    "Design",
    "Marketing",
    "IT & Software",
    "Personal Development",
  ];

  const levels = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "All Levels",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-medium">Price Range</h3>
        <div className="space-y-4">
          <Slider
            defaultValue={[0, 100]}
            max={200}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm">
            <span>$0</span>
            <span>$200</span>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox id={category} />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="levels">
          <AccordionTrigger>Level</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {levels.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox id={level} />
                  <Label htmlFor={level}>{level}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="duration">
          <AccordionTrigger>Duration</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="0-2-hours" />
                <Label htmlFor="0-2-hours">0-2 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="3-6-hours" />
                <Label htmlFor="3-6-hours">3-6 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="7-16-hours" />
                <Label htmlFor="7-16-hours">7-16 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="17plus-hours" />
                <Label htmlFor="17plus-hours">17+ hours</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ratings">
          <AccordionTrigger>Ratings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox id={`rating-${rating}`} />
                  <Label htmlFor={`rating-${rating}`}>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1 fill-current" />
                      {rating} & up
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Button variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  );
}