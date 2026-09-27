import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRefresh } from "./ProfileRefresh";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function renderButton() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProfileRefresh
        target={{ region: "euw1", gameName: "kaanproak0", tagLine: "TR1" }}
        fetchedAt={new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()}
      />
    </QueryClientProvider>
  );
}

function answer(status: number, body: unknown): void {
  global.fetch = vi.fn(async () => ({
    ok: status < 400,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

beforeEach(() => refresh.mockReset());

describe("ProfileRefresh", () => {
  it("says how old the profile is", () => {
    renderButton();
    expect(screen.getByText("Updated 3h ago")).toBeInTheDocument();
  });

  it("re-renders the page once a fresh read has landed", async () => {
    answer(200, { data: { refreshed: true, fetchedAt: null } });
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /update/i }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("says when the profile was just updated instead of pretending to refresh", async () => {
    answer(200, { data: { refreshed: false, retryAfterMs: 45_000 } });
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /update/i }));

    expect(await screen.findByText("Just updated — next update in 45s.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("tells a throttled visitor to wait", async () => {
    answer(429, { error: { code: "RATE_LIMITED", message: "Too many lookups." } });
    renderButton();

    await userEvent.click(screen.getByRole("button", { name: /update/i }));

    expect(
      await screen.findByText("Too many lookups — try again in a few minutes.")
    ).toBeInTheDocument();
  });
});
