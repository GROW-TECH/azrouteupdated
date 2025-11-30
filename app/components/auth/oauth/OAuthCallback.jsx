// components/auth/oauth/OAuthCallback.jsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Icons } from "../../icons";
import { useRouter } from "next/router";

export function OAuthCallback() {
  const [status, setStatus] = useState("Processing");
  const router = useRouter();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Process OAuth callback
        // In a real app, you would:
        // 1. Exchange the code for tokens
        // 2. Get user info
        // 3. Create/update user in your database
        // 4. Set authentication state
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push("/dashboard");
      } catch (error) {
        setStatus("Error occurred during authentication");
        // Redirect to login after delay
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    processOAuthCallback();
  }, [router]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Icons.spinner className="h-6 w-6 animate-spin" />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {status}
        </p>
      </CardContent>
    </Card>
  );
}