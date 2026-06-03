"use client";

import { Bell } from "lucide-react";

export function NotificationBell() {
  return (
    <button
      title="Notifications"
      className="relative rounded-md p-2 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      <Bell className="h-4 w-4" />
    </button>
  );
}
