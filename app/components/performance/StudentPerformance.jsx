// components/performance/StudentPerformance.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { GradesChart } from "./GradesChart";
import { SkillProgress } from "./SkillProgress";
import { AssessmentHistory } from "./AssessmentHistory";
import { LearningProgress } from "./LearningProgress";
import { Button } from "../ui/button";
import { Download, Calendar, TrendingUp, Award } from "lucide-react";

export function StudentPerformance({ studentId }) {
  const performanceStats = {
    overallGrade: 85,
    courseCompletion: 72,
    assessmentsPassed: 15,
    totalAssessments: 18,
    skillsMastered: 8,
    totalSkills: 12,
    lastAssessment: "Advanced JavaScript - Week 8"
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.overallGrade}%</div>
            <p className="text-xs text-muted-foreground">Top 15% of class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.courseCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              {performanceStats.assessmentsPassed} of {performanceStats.totalAssessments} assessments completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Mastered</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceStats.skillsMastered}/{performanceStats.totalSkills}
            </div>
            <p className="text-xs text-muted-foreground">2 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Assessment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{performanceStats.lastAssessment}</div>
            <p className="text-xs text-muted-foreground">Completed 2 days ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="grades" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="progress">Learning Progress</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
        <TabsContent value="grades">
          <GradesChart />
        </TabsContent>
        <TabsContent value="skills">
          <SkillProgress />
        </TabsContent>
        <TabsContent value="assessments">
          <AssessmentHistory />
        </TabsContent>
        <TabsContent value="progress">
          <LearningProgress />
        </TabsContent>
      </Tabs>
    </div>
  );
}