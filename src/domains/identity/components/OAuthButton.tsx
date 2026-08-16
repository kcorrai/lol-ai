"use client";

import { signIn } from "next-auth/react";

type OAuthProvider = "google";

const providerConfig: Record<OAuthProvider, { label: string; icon: string; caption: string }> = {
  google: {
    label: "Continue with Google",
    icon: "G",
    caption: "We only read your name and email",
  },
};

interface OAuthButtonProps {
  provider: OAuthProvider;
  callbackUrl?: string;
  /** The label under the divider that follows. Sign-up says "or with email" too. */
  dividerLabel?: string;
}

/**
 * The design leads with OAuth because it is the shortest real path, so this is the full-width
 * primary-sized control and the email form sits under the rule below it.
 */
export function OAuthButton({
  provider,
  callbackUrl = "/dashboard",
  dividerLabel = "or with email",
}: OAuthButtonProps): React.ReactElement {
  const config = providerConfig[provider];

  return (
    <div>
      <button
        type="button"
        onClick={() => signIn(provider, { callbackUrl })}
        className="tag-cut flex h-11 w-full items-center justify-center gap-2.5 border border-line-2 bg-surface-2 font-display text-xs font-bold uppercase tracking-[0.1em] text-text transition-colors duration-150 hover:border-accent hover:bg-ink-500"
      >
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-ink-900">
          {config.icon}
        </span>
        {config.label}
      </button>

      <p className="mt-2.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
        {config.caption}
      </p>

      <div className="my-5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-line-1" />
        <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
          {dividerLabel}
        </span>
        <span className="h-px flex-1 bg-line-1" />
      </div>
    </div>
  );
}
