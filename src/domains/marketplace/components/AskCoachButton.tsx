"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenThread } from "@/hooks/useThreads";

interface Props {
  coachSlug: string;
  coachName: string;
}

/**
 * "Ask a question" on a coach's profile — the step before paying a stranger.
 *
 * Opens (or reuses) the thread and lands in Messages with it selected. Signed
 * out, it goes through the login page and comes back to the profile.
 */
export function AskCoachButton({ coachSlug, coachName }: Props): React.ReactElement {
  const router = useRouter();
  const { status } = useSession();
  const open = useOpenThread();
  const [error, setError] = useState<string | null>(null);

  async function ask(): Promise<void> {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/coaches/${coachSlug}`)}`);
      return;
    }
    setError(null);
    try {
      const { conversationId } = await open.mutateAsync({ coachSlug });
      router.push(`/messages?thread=${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open a conversation.");
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => void ask()}
        disabled={open.isPending}
      >
        <MessageCircleQuestion className="h-4 w-4" aria-hidden />
        Ask {coachName} a question
      </Button>
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
