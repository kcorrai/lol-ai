import type { Metadata } from "next";
import { AccountConnectionForm } from "@/domains/riot/components/AccountConnectionForm";

export const metadata: Metadata = { title: "Connected Accounts" };

export default function AccountsSettingsPage() {
  return (
    <div className="max-w-lg space-y-8 p-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Connected Accounts</h1>
        <p className="mt-1 text-sm text-text-muted">
          Connect your Riot account to start receiving AI coaching.
        </p>
      </div>
      <AccountConnectionForm />
    </div>
  );
}
