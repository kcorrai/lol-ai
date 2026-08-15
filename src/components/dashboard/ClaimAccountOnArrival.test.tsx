import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => searchParams,
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@/hooks/useRiotAccounts", () => ({ useRiotAccounts: vi.fn() }));
vi.mock("@/lib/api/fetcher", () => ({ apiFetch: vi.fn() }));

import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { apiFetch } from "@/lib/api/fetcher";
import { ClaimAccountOnArrival } from "./ClaimAccountOnArrival";

const CLAIM = "claimRegion=tr1&claimName=kaanproak0&claimTag=TR1";
const CONNECTED = { gameName: "kaanproak0", tagLine: "TR1", region: "tr1" };

function accounts(list: unknown[], isLoading = false): void {
  vi.mocked(useRiotAccounts).mockReturnValue({ data: list, isLoading } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams(CLAIM);
  accounts([]);
  vi.mocked(apiFetch).mockResolvedValue(undefined as never);
});

describe("ClaimAccountOnArrival", () => {
  it("connects the claimed account on arrival", async () => {
    render(<ClaimAccountOnArrival />);

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith("/api/riot/connect", {
        method: "POST",
        body: JSON.stringify({ region: "tr1", gameName: "kaanproak0", tagLine: "TR1" }),
      }),
    );
  });

  it("clears the claim from the URL so a refresh does not repeat it", async () => {
    render(<ClaimAccountOnArrival />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("does nothing when there is no claim in the URL", () => {
    searchParams = new URLSearchParams();
    render(<ClaimAccountOnArrival />);

    expect(apiFetch).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not re-connect an account the user already has", async () => {
    accounts([CONNECTED]);
    render(<ClaimAccountOnArrival />);

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("waits for the account list rather than connecting against unknown state", () => {
    accounts([], true);
    render(<ClaimAccountOnArrival />);

    expect(apiFetch).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("stays quiet when the account was already connected in another tab", async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new Error("This Riot account is already connected to your profile."),
    );
    render(<ClaimAccountOnArrival />);

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("points at manual setup when the connect genuinely fails", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("Riot ID not found"));
    render(<ClaimAccountOnArrival />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Riot ID not found");
    expect(screen.getByRole("link", { name: /account settings/i })).toHaveAttribute(
      "href",
      "/settings/accounts",
    );
  });
});
