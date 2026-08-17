"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useThread, useSendMessage } from "@/hooks/useThreads";

interface Props {
  conversationId: string;
}

/**
 * One conversation.
 *
 * When something is stripped out of a message, the sender is told immediately
 * and the message is marked — hiding it would leave them believing they had
 * shared a Discord tag that never arrived, which is worse for them than the
 * rule itself.
 */
export function ThreadView({ conversationId }: Props): React.ReactElement {
  const { data, isLoading } = useThread(conversationId);
  const send = useSendMessage(conversationId);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(): Promise<void> {
    const body = draft.trim();
    if (!body) return;

    setNotice(null);
    const result = await send.mutateAsync(body);
    setDraft("");
    setNotice(result.notice);
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const thread = data?.thread;

  return (
    <div className="flex h-[28rem] flex-col rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-2">
        <p className="text-sm font-semibold text-text">{thread?.withName ?? "Conversation"}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {thread?.messages.length === 0 && (
          <p className="text-sm text-text-faint">
            Nothing yet. Say what you are hoping to get out of the session.
          </p>
        )}

        {thread?.messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2",
                message.mine ? "bg-accent/15 text-text" : "bg-surface-2 text-text-body"
              )}
            >
              <p className="whitespace-pre-wrap text-sm">{message.body}</p>
              {message.wasRedacted && (
                <p className="mt-1 text-[10.5px] text-warning">Contact details removed</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <p className="border-t border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
          {notice}
        </p>
      )}

      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Message…"
          className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="sm" disabled={send.isPending || !draft.trim()} onClick={() => void submit()}>
          <Send className="h-3.5 w-3.5" aria-hidden />
          Send
        </Button>
      </div>
    </div>
  );
}
