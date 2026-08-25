"use client";

import { useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/uiLocale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useThread, useSendMessage } from "@/hooks/useThreads";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";

interface Props {
  conversationId: string;
}

// Only what the redactor actually strips, so the warning never fires on
// something that will go through untouched. Kept loose on purpose — a false
// positive here costs a moment's hesitation, a false negative costs trust.
const CONTACTISH = /(\+?\d[\d\s-]{7,})|(@[\w.]+)|(discord\.gg)|(t\.me)/i;

const QUICK_REPLIES = ["Can we move it an hour?", "Sent the VOD", "Which champion should I bring?"];

/**
 * One conversation.
 *
 * When something is stripped out of a message, the sender is told immediately
 * and the message is marked — hiding it would leave them believing they had
 * shared a Discord tag that never arrived, which is worse for them than the
 * rule itself. The composer warns *before* sending for the same reason.
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

  if (isLoading) return <Skeleton className="h-[28rem] w-full" />;

  const thread = data?.thread;
  const contactish = CONTACTISH.test(draft);

  return (
    <section className="notch flex h-[32rem] flex-col overflow-hidden border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3.5 border-b border-line-1 bg-surface-2 px-5 py-3">
        <CoachPortrait name={thread?.withName ?? "?"} size="sm" />
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold uppercase tracking-[0.03em] text-text">
            {thread?.withName ?? "Conversation"}
          </p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-faint">
            Both sides keep this record &middot; disputes are read against it
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background p-5">
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
                "tag-cut max-w-[72%] border px-4 py-3",
                message.wasRedacted
                  ? "border-warning bg-warning/10"
                  : message.mine
                    ? "border-accent/35 bg-accent/10"
                    : "border-line-2 bg-surface"
              )}
            >
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed",
                  message.mine ? "text-text" : "text-text-body"
                )}
              >
                {message.body}
              </p>

              {message.wasRedacted && (
                <p className="mt-2.5 flex items-center gap-2 border-t border-warning/30 pt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-warning">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Contact details removed
                </p>
              )}

              <p
                className={cn(
                  "mt-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint",
                  message.mine ? "text-right" : "text-left"
                )}
              >
                {stamp(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <p className="border-t border-warning/30 bg-warning/10 px-5 py-2 text-xs text-warning">
          {notice}
        </p>
      )}

      <div className="grid gap-2.5 border-t border-line-1 p-4">
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
          placeholder="Say what you need. Contact details are stripped automatically."
          className={cn(
            "well w-full resize-y border bg-background px-3 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            contactish ? "border-warning" : "border-line-2"
          )}
        />

        <div className="flex flex-wrap items-center gap-3.5">
          <Button
            size="sm"
            disabled={send.isPending || !draft.trim()}
            onClick={() => void submit()}
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Send
          </Button>

          <span className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => setDraft(reply)}
                className="tag-cut border border-line-2 bg-surface-dark px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-muted hover:text-text"
              >
                {reply}
              </button>
            ))}
          </span>

          <span
            className={cn(
              "ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em]",
              contactish ? "text-warning" : "text-text-faint"
            )}
          >
            {contactish
              ? "That looks like contact details — it will be stripped"
              : "Both sides keep this record"}
          </span>
        </div>
      </div>
    </section>
  );
}

function stamp(iso: string): string {
  return formatDateTime(iso, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
