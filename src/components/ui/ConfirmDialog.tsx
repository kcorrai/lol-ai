"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Callers mount and unmount this rather than passing `open`, so Radix's `open` is pinned true and
 * dismissal is reported through `onCancel`. Radix supplies the parts that are easy to get subtly
 * wrong by hand: focus trapping and restoration, `aria-modal`, Escape, scroll locking, and making
 * the page behind inert.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isPending = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // While a destructive action is in flight the buttons are disabled, so Escape and outside-click
  // must not offer a way around them.
  function guard(event: Event): void {
    if (isPending) event.preventDefault();
  }

  return (
    <Dialog.Root open onOpenChange={(next) => { if (!next && !isPending) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          onEscapeKeyDown={guard}
          onPointerDownOutside={guard}
          onInteractOutside={guard}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4"
        >
          <div className="space-y-1">
            <Dialog.Title className="text-base font-bold text-text">{title}</Dialog.Title>
            <Dialog.Description className="text-sm text-text-muted">
              {description}
            </Dialog.Description>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
              className="text-text-muted"
            >
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isPending}
              className={danger ? "gap-1.5 bg-danger hover:bg-danger/90 text-white" : "gap-1.5"}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
