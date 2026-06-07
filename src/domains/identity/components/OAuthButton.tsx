"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type OAuthProvider = "google";

const providerConfig: Record<OAuthProvider, { label: string; icon: string }> = {
  google: {
    label: "Google ile Devam Et",
    icon: "G",
  },
};

interface OAuthButtonProps {
  provider: OAuthProvider;
  callbackUrl?: string;
}

export function OAuthButton({ provider, callbackUrl = "/dashboard" }: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => signIn(provider, { callbackUrl })}
    >
      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-800">
        {config.icon}
      </span>
      {config.label}
    </Button>
  );
}
