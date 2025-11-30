// components/profile/AboutSection.jsx
"use client"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { EditAboutDialog } from "./EditAboutDialog";
import { useState } from "react";

export function AboutSection({ user, isEditable }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bio</CardTitle>
          {isEditable && (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {user.bio || "No bio provided yet."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills & Expertise</CardTitle>
          {isEditable && (
            <Button variant="ghost">Edit</Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.skills?.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {isEditable && (
        <EditAboutDialog
          user={user}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
    </div>
  );
}
