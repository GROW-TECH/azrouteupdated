"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";

export default function UpdateMarksPage() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [marks, setMarks] = useState([
    { student: "Alice", score: "", maxMarks: "100", remarks: "" },
    { student: "Bob", score: "", maxMarks: "100", remarks: "" },
    { student: "Charlie", score: "", maxMarks: "100", remarks: "" },
  ]);

  const handleChange = (index, field, value) => {
    const newMarks = [...marks];
    newMarks[index][field] = value;
    setMarks(newMarks);
  };

  const handleSave = () => {
    console.log("Course:", selectedCourse);
    console.log("Marks submitted:", marks);
    alert("Marks saved successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Update Marks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Course Dropdown */}
          <div>
            <label className="block mb-2 font-medium">Course</label>
            <Select onValueChange={setSelectedCourse} value={selectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course1">Course 1</SelectItem>
                <SelectItem value="course2">Course 2</SelectItem>
                <SelectItem value="course3">Course 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Student Name</th>
                  <th className="px-4 py-2 border">Marks</th>
                  <th className="px-4 py-2 border">Max Marks</th>
                  <th className="px-4 py-2 border">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{entry.student}</td>
                    <td className="px-4 py-2 border">
                      <Input
                        type="number"
                        value={entry.score}
                        onChange={(e) => handleChange(index, "score", e.target.value)}
                        className="w-24"
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <Input
                        type="number"
                        value={entry.maxMarks}
                        onChange={(e) => handleChange(index, "maxMarks", e.target.value)}
                        className="w-24"
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <Input
                        value={entry.remarks}
                        onChange={(e) => handleChange(index, "remarks", e.target.value)}
                        className="w-48"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
