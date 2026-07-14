"use client";

import { useSession } from "next-auth/react";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { ActiveSessionsList } from "./ActiveSessionsList";

export default function SecuritySettingsPage() {
  const { data: session } = useSession();

  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Security</h1>
        <p className="mt-1 text-sm text-text-muted">
          Secure your account with two-factor authentication.
        </p>
      </div>
      <TwoFactorSetup />
      <ActiveSessionsList />
    </div>
  );
}
