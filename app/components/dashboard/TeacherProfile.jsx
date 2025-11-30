// components/dashboard/TeacherProfile.jsx
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
  } from "@/components/ui/card";
  import { 
    Avatar, 
    AvatarFallback 
  } from "@/components/ui/avatar";
  import { Mail, Phone, MapPin } from "lucide-react";
  
  export function TeacherProfile({ teacher }) {
    if (!teacher) return null;
  
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>
                {teacher.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{teacher.name}</h3>
              <p className="text-sm text-muted-foreground">
                {teacher.department || 'Department not set'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{teacher.email}</span>
            </div>
            {teacher.phone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.phone}</span>
              </div>
            )}
            {teacher.location && (
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }