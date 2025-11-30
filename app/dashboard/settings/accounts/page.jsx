// app/dashboard/settings/accounts/page.jsx
import { ConnectedAccounts } from "@/components/auth/oauth/ConnectedAccounts";

export default function ConnectedAccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Connected Accounts</h3>
        <p className="text-sm text-muted-foreground">
          Manage your connected accounts and control data synchronization
        </p>
      </div>
      <ConnectedAccounts />
    </div>
  );
}