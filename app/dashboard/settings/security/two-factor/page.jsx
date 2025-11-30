// app/dashboard/settings/security/two-factor/page.jsx
import { TwoFactorSetup } from "@/components/auth/2fa/TwoFactorSetup";

export default function TwoFactorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Manage your two-factor authentication settings
        </p>
      </div>
      <TwoFactorSetup />
    </div>
  );
}