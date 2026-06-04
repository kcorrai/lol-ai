"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userEmail = session?.user?.email ?? "";
  const canDelete = confirmEmail === userEmail && userEmail.length > 0;

  async function handleDelete() {
    if (!canDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Failed to delete account");
      }
      await signOut({ callbackUrl: "/?deleted=1" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <PageHeader
        title="Profile"
        subtitle="Manage your account settings."
      />

      <div className="space-y-8">
        {/* Account info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text">{userEmail || "—"}</p>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <div className="rounded-xl border border-danger/40 bg-danger/5 p-6">
          <p className="mb-1 text-sm font-semibold text-danger">Delete Account</p>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            This is permanent and cannot be undone. All your Riot accounts, match data, coaching
            reports, and subscription history will be deleted. To confirm, type your email address
            below.
          </p>

          <div className="space-y-3">
            <Input
              type="email"
              placeholder={userEmail || "your@email.com"}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={isDeleting}
              className="border-border bg-background text-sm"
            />

            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="w-full"
            >
              {isDeleting ? "Deleting account…" : "Permanently delete my account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
