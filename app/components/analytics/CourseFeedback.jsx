// components/analytics/CourseFeedback.jsx
// import { StarRating } from "./StarRating";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Star } from "lucide-react";
function StarRating({ rating }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
export function CourseFeedback() {
  const feedback = [
    {
      student: "John D.",
      rating: 4.5,
      comment: "Very comprehensive course with great practical examples.",
      date: "2024-10-25"
    },
    {
      student: "Sarah M.",
      rating: 5,
      comment: "The instructor was very knowledgeable and engaging.",
      date: "2024-10-24"
    },
    {
      student: "Michael R.",
      rating: 4,
      comment: "Good content but could use more practice exercises.",
      date: "2024-10-23"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {feedback.map((item, index) => (
            <div key={index} className="pb-4 border-b last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{item.student}</p>
                  <StarRating rating={item.rating} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{item.comment}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}