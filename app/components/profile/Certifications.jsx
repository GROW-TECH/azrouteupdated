// components/profile/Certifications.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { FileCheck, Download, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";


export function Certifications({ user }) {
  const certifications = [
    {
      id: 1,
      title: "Advanced Web Development Certificate",
      issueDate: "2024-09-15",
      expiry: "2027-09-15",
      credentialId: "WD-2024-1234",
      skills: ["React", "Node.js", "MongoDB"],
      status: "active",
    },
    {
      id: 2,
      title: "Full Stack Development Certification",
      issueDate: "2024-08-01",
      expiry: "2027-08-01",
      credentialId: "FS-2024-5678",
      skills: ["JavaScript", "Python", "SQL"],
      status: "active",
    },
  ];

  return (
    <div className="space-y-6">
      {certifications.map((cert) => (
        <Card key={cert.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center">
                <FileCheck className="h-5 w-5 mr-2 text-primary" />
                {cert.title}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Credential ID: {cert.credentialId}
              </div>
            </div>
            <Badge
              variant={cert.status === "active" ? "default" : "secondary"}
            >
              {cert.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Issued:</span>{" "}
                {new Date(cert.issueDate).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Expires:</span>{" "}
                {new Date(cert.expiry).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cert.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}