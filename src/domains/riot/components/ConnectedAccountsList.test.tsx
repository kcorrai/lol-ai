import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useRiotAccounts", () => ({ useRiotAccounts: vi.fn() }));
vi.mock("@/hooks/useSubscription", () => ({ useSubscription: vi.fn() }));
vi.mock("@/hooks/useSyncAccount", () => ({ useSyncAccount: vi.fn() }));
vi.mock("@/hooks/useSyncStatus", () => ({ useSyncStatus: vi.fn(), isSyncActive: () => false }));
vi.mock("@/hooks/useDisconnectAccount", () => ({ useDisconnectAccount: vi.fn() }));
vi.mock("@/hooks/useSetPrimaryAccount", () => ({ useSetPrimaryAccount: vi.fn() }));

import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSubscription } from "@/hooks/useSubscription";
import { useSyncAccount } from "@/hooks/useSyncAccount";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useDisconnectAccount } from "@/hooks/useDisconnectAccount";
import { useSetPrimaryAccount } from "@/hooks/useSetPrimaryAccount";
import { ConnectedAccountsList } from "./ConnectedAccountsList";

/** A mutation result in whichever state the test needs. */
function mutation(overrides: Record<string, unknown> = {}) {
  return { mutate: vi.fn(), isPending: false, isError: false, error: null, variables: undefined, ...overrides };
}

function failing(message: string) {
  return mutation({ isError: true, error: new Error(message) });
}

function account(id: string, gameName: string, isPrimary: boolean) {
  return {
    id,
    gameName,
    tagLine: "EUW",
    region: "euw1",
    isPrimary,
    lastSyncedAt: null,
    profileIconId: 1,
    summonerLevel: 30,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useRiotAccounts).mockReturnValue({
    data: [account("acc-1", "Player One", false)],
    isLoading: false,
  } as never);
  vi.mocked(useSubscription).mockReturnValue({ data: { plan: "pro" } } as never);
  vi.mocked(useSyncStatus).mockReturnValue({ data: undefined } as never);
  vi.mocked(useSyncAccount).mockReturnValue(mutation() as never);
  vi.mocked(useDisconnectAccount).mockReturnValue(mutation() as never);
  vi.mocked(useSetPrimaryAccount).mockReturnValue(mutation() as never);
});

describe("ConnectedAccountsList", () => {
  it("shows nothing about errors on the happy path", () => {
    render(<ConnectedAccountsList />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  /**
   * The defect: a rejected disconnect rendered nothing, so pressing Confirm appeared to do nothing
   * at all. The most likely rejection is the deliberate CANNOT_DISCONNECT_FREE_PLAN message.
   */
  it("surfaces a failed disconnect", () => {
    vi.mocked(useDisconnectAccount).mockReturnValue(
      failing("Free plan accounts cannot be disconnected.") as never
    );

    render(<ConnectedAccountsList />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Free plan accounts cannot be disconnected."
    );
  });

  it("surfaces a failed set-primary", () => {
    vi.mocked(useSetPrimaryAccount).mockReturnValue(
      failing("This Riot account does not belong to your profile") as never
    );

    render(<ConnectedAccountsList />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "This Riot account does not belong to your profile"
    );
  });

  // Collapsing back to the idle button would hide the message the user needs to read.
  it("keeps the disconnect confirmation open after a failure", async () => {
    vi.mocked(useDisconnectAccount).mockReturnValue(failing("Disconnect failed") as never);

    render(<ConnectedAccountsList />);
    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Disconnect failed");
  });

  it("shows one message per failing mutation, not one per card", () => {
    vi.mocked(useRiotAccounts).mockReturnValue({
      data: [account("acc-1", "Player One", true), account("acc-2", "Player Two", false)],
      isLoading: false,
    } as never);
    vi.mocked(useSetPrimaryAccount).mockReturnValue(failing("Set primary failed") as never);

    render(<ConnectedAccountsList />);

    // Only the second card renders a "Make Primary" button, but each card owns its own mutation
    // instance — so the error belongs to whichever card's mutation rejected.
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("renders an empty state when there are no accounts", () => {
    vi.mocked(useRiotAccounts).mockReturnValue({ data: [], isLoading: false } as never);

    render(<ConnectedAccountsList />);

    expect(screen.getByText(/No connected accounts yet/)).toBeInTheDocument();
  });

  it("hides disconnect entirely on the free plan", () => {
    vi.mocked(useSubscription).mockReturnValue({ data: { plan: "free" } } as never);

    render(<ConnectedAccountsList />);

    expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
  });
});
