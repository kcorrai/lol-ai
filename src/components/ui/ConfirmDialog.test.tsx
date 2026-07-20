import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete account"
        description="This cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...overrides}
      />
    );
    return { onConfirm, onCancel };
  }

  it("renders the title and description", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Delete account" })).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const { onConfirm, onCancel } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const { onConfirm, onCancel } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("uses the custom labels when provided", () => {
    setup({ confirmLabel: "Yes, delete", cancelLabel: "Keep it" });

    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });

  it("exposes a dialog named by its title and described by its description", () => {
    setup();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Delete account");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  // Focus used to stay on whatever opened the dialog — behind the overlay — so tabbing walked
  // straight into the page underneath.
  it("moves focus into the dialog", async () => {
    setup();

    await vi.waitFor(() => {
      expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
    });
  });

  it("cancels on Escape", async () => {
    const { onCancel, onConfirm } = setup();

    await userEvent.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  // The dialog fronts destructive, non-idempotent actions, so a second click while the first is
  // in flight would submit twice.
  it("disables both buttons while the action is pending", async () => {
    const { onConfirm, onCancel } = setup({ isPending: true });

    const confirm = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });

    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();

    await userEvent.click(confirm);
    await userEvent.click(cancel);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  // The buttons are disabled mid-flight, so Escape must not offer a way around them.
  it("cannot be dismissed with Escape while pending", async () => {
    const { onCancel } = setup({ isPending: true });

    await userEvent.keyboard("{Escape}");

    expect(onCancel).not.toHaveBeenCalled();
  });
});
