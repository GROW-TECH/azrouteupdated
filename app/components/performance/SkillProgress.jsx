// components/performance/SkillProgress.jsx
"use client"
import { Progress } from "../ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export function SkillProgress() {
  const skills = [
    { name: "HTML/CSS", score: 90, status: "Mastered" },
    { name: "JavaScript", score: 85, status: "Advanced" },
    { name: "React", score: 75, status: "Intermediate" },
    { name: "Node.js", score: 65, status: "Learning" },
    { name: "Database", score: 70, status: "Intermediate" },
    { name: "API Design", score: 80, status: "Advanced" },
  ];

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Skill Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={skills}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Skills"
                dataKey="score"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-muted-foreground">{skill.status}</span>
                </div>
                <Progress value={skill.score} max={100} />
                <p className="text-xs text-muted-foreground">
                  {skill.score}% proficiency
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}