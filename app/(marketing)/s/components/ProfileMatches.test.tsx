import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { previewMatchFixture } from "@/types/preview.fixture";
import type { PreviewMatch } from "@/types/preview";
import { ProfileMatches } from "./ProfileMatches";

// The expanded scoreboard is the signed-in match view, tested where it lives. Stubbing it keeps
// this spec about the list's own behaviour — which queues it offers and what it filters to.
vi.mock("@/domains/match/components/MatchScoreboard", () => ({
  MatchScoreboard: () => <div data-testid="scoreboard" />,
}));

function renderList(matches: PreviewMatch[]) {
  // `retry: false` so a failed fetch surfaces immediately instead of after three backoffs.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProfileMatches
        matches={matches}
        scoreboards={{}}
        puuid="puuid-1"
        region="euw1"
        gameName="kaanproak0"
        tagLine="TR1"
      />
    </QueryClientProvider>
  );
}

const solo = (over: Partial<PreviewMatch> = {}) =>
  previewMatchFixture({ queueType: "RANKED_SOLO_5x5", ...over });
const aram = (over: Partial<PreviewMatch> = {}) =>
  previewMatchFixture({ queueType: "ARAM", championName: "Ziggs", ...over });

describe("ProfileMatches", () => {
  it("renders nothing rather than an empty panel when there are no matches", () => {
    const { container } = renderList([]);

    expect(container).toBeEmptyDOMElement();
  });

  /** A tab that filters to nothing is worse than no tab, so one queue means no tab row. */
  it("offers no queue tabs when every game is the same queue", () => {
    renderList([solo({ matchId: "M1" }), solo({ matchId: "M2" })]);

    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
  });

  it("offers a tab per queue the player actually has, and never one they do not", () => {
    renderList([solo({ matchId: "M1" }), aram({ matchId: "M2" })]);

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ranked Solo/Duo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ARAM" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ranked Flex" })).not.toBeInTheDocument();
  });

  it("narrows the list to the chosen queue and back", async () => {
    const user = userEvent.setup();
    renderList([solo({ matchId: "M1" }), aram({ matchId: "M2" })]);

    expect(screen.getByText("Ahri")).toBeInTheDocument();
    expect(screen.getByText("Ziggs")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ARAM" }));

    expect(screen.queryByText("Ahri")).not.toBeInTheDocument();
    expect(screen.getByText("Ziggs")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Ahri")).toBeInTheDocument();
  });

  /**
   * The count names what is loaded, not what is shown — it sits beside the tabs, so making it
   * follow the filter would read as games having disappeared from the account.
   */
  it("counts every loaded match in the heading, not just the filtered ones", async () => {
    const user = userEvent.setup();
    renderList([solo({ matchId: "M1" }), aram({ matchId: "M2" })]);

    await user.click(screen.getByRole("button", { name: "ARAM" }));

    expect(screen.getByText("// Last 2 matches")).toBeInTheDocument();
  });

  it("makes no request until the visitor asks for more", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderList([solo({ matchId: "M1" })]);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
