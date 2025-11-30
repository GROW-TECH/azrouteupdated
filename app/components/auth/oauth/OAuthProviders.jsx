// components/auth/oauth/OAuthProviders.jsx
import { Button } from "../../ui/button";
import { Icons } from "../../icons";
import { Separator } from "../../ui/separator";

export function OAuthProviders({ action = "Sign in", onProviderClick }) {
  const providers = [
    {
      id: "google",
      name: "Google",
      icon: Icons.google,
      color: "bg-white hover:bg-gray-50",
      textColor: "text-black",
    },
    {
      id: "github",
      name: "GitHub",
      icon: Icons.github,
      color: "bg-[#24292F] hover:bg-[#24292F]/90",
      textColor: "text-white",
    },
    {
      id: "microsoft",
      name: "Microsoft",
      icon: Icons.microsoft,
      color: "bg-[#00A4EF] hover:bg-[#00A4EF]/90",
      textColor: "text-white",
    },
    {
      id: "apple",
      name: "Apple",
      icon: Icons.apple,
      color: "bg-black hover:bg-black/90",
      textColor: "text-white",
    },
  ];

  return (
    <div className="grid gap-4">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className={`w-full ${provider.color} ${provider.textColor}`}
          onClick={() => onProviderClick(provider.id)}
        >
          <provider.icon className="h-5 w-5 mr-2" />
          {action} with {provider.name}
        </Button>
      ))}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}