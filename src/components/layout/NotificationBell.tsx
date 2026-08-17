"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";

/**
 * The bell, finally wired to something.
 *
 * It has been a static button since the initial layout — the `Notification`
 * table existed and nothing wrote to it, because everything the app told people
 * went by email. The marketplace needs both: a coach may not be on the site
 * when a request arrives, and will be later and has to find it.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const unread = data?.unread ?? 0;

  function toggle(): void {
    const next = !open;
    setOpen(next);
    // Read on open, which is the only moment they have actually been seen.
    if (next && unread > 0) markRead.mutate();
  }

  return (
    <div className="relative">
      <button
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={toggle}
        className="relative rounded-md p-2 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away, so the panel does not need a global listener. */}
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-1 max-h-96 w-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
            {(data?.notifications.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-text-muted">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data?.notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link
                      href={notification.actionUrl ?? "#"}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block px-4 py-3 transition-colors hover:bg-surface-2",
                        !notification.isRead && "bg-accent/5"
                      )}
                    >
                      <p className="text-sm font-semibold text-text">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{notification.body}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
