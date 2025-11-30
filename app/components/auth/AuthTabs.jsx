// components/auth/AuthTabs.jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Card } from "../ui/card";

export function AuthTabs({ defaultTab = "login", userType }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm userType={userType} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm userType={userType} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}