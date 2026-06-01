import type { Metadata } from "next";
import { AccountConnectionForm } from "@/domains/riot/components/AccountConnectionForm";
import { ConnectedAccountsList } from "@/domains/riot/components/ConnectedAccountsList";

export const metadata: Metadata = { title: "Connected Accounts" };

export default function AccountsSettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8 p-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Connected Accounts</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your Riot accounts and sync match data.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Your Accounts
        </h2>
        <ConnectedAccountsList />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Add Account
        </h2>
        <AccountConnectionForm />
      </section>
    </div>
  );
}
