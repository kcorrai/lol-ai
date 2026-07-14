import type { Metadata } from "next";
import { AccountConnectionForm } from "@/domains/riot/components/AccountConnectionForm";
import { ConnectedAccountsList } from "@/domains/riot/components/ConnectedAccountsList";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Connected Accounts" };

export default function AccountsSettingsPage() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <PageHeader
        title="Connected Accounts"
        subtitle="Manage your Riot accounts and sync match data."
      />

      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            My Accounts
          </p>
          <ConnectedAccountsList />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Add Account
          </p>
          <AccountConnectionForm />
        </section>
      </div>
    </div>
  );
}
