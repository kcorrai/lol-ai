import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/hooks/useCreateCheckout", () => ({ useCreateCheckout: vi.fn() }));

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCreateCheckout } from "@/hooks/useCreateCheckout";
import { UpgradeModal } from "./UpgradeModal";

const push = vi.fn();
const mutate = vi.fn();

function setup(props: Partial<Parameters<typeof UpgradeModal>[0]> = {}) {
  const onClose = vi.fn();
  render(<UpgradeModal open onClose={onClose} {...props} />);
  return { onClose };
}

function signedIn(yes: boolean) {
  vi.mocked(useSession).mockReturnValue({ data: yes ? { user: { id: "u1" } } : null } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push } as never);
  vi.mocked(useCreateCheckout).mockReturnValue({ mutate, isPending: false } as never);
  signedIn(true);
});

describe("UpgradeModal", () => {
  it("renders nothing when closed", () => {
    setup({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes a dialog named by the reason it was opened for", () => {
    setup({ reason: "DAILY_REPORT_LIMIT_REACHED" });

    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "You've reached your daily report limit"
    );
  });

  it("falls back to generic copy for an unrecognised reason", () => {
    setup({ reason: "SOMETHING_ELSE" });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Upgrade to Pro");
  });

  // The backdrop used to be a bare <div> with an onClick, so this was mouse-only.
  it("closes on Escape", async () => {
    const { onClose } = setup();

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button", async () => {
    const { onClose } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("starts checkout for a signed-in user", async () => {
    setup();

    await userEvent.click(screen.getByRole("button", { name: /Upgrade to Pro/ }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  // An anonymous visitor has no subscription to attach a checkout to.
  it("sends an anonymous visitor to register instead of checkout", async () => {
    signedIn(false);
    setup();

    await userEvent.click(screen.getByRole("button", { name: /Get Started Free/ }));

    expect(push).toHaveBeenCalledWith("/register");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("disables the call to action while the checkout redirect is in flight", () => {
    vi.mocked(useCreateCheckout).mockReturnValue({ mutate, isPending: true } as never);
    setup();

    expect(screen.getByRole("button", { name: "Redirecting..." })).toBeDisabled();
  });
});
