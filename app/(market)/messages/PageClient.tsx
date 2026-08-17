"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useThreads } from "@/hooks/useThreads";
import { ThreadView } from "@/domains/marketplace/components/ThreadView";

export default function MessagesPage(): React.ReactElement {
  const { data, isLoading } = useThreads();
  const [open, setOpen] = useState<string | null>(null);

  const threads = data?.threads ?? [];
  const selected = open ?? threads[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Messages</h1>
        <p className="mt-1 text-sm text-text-muted">
          Keep it here. Sessions arranged off LaneIQ are not covered if something goes wrong.
        </p>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && threads.length === 0 && (
        <EmptyState
          title="No conversations"
          description="A thread opens once you have booked a coach, or once somebody has booked you."
        />
      )}

      {threads.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
          <nav className="space-y-1">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setOpen(thread.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  thread.id === selected
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border bg-surface text-text-muted hover:text-text"
                )}
              >
                <span className="truncate">{thread.withName}</span>
                {thread.unread > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-[10.5px] font-semibold text-background">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {selected && <ThreadView conversationId={selected} />}
        </div>
      )}
    </div>
  );
}
