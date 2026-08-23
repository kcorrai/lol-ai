import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/components/search/usePlayerSearch", () => ({ usePlayerSearch: vi.fn() }));

import { usePlayerSearch } from "@/components/search/usePlayerSearch";
import { useSearchStore } from "@/lib/stores/searchStore";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import type { SearchHit } from "@/components/search/searchTypes";

const FAKER: SearchHit = {
  puuid: "puuid-faker",
  gameName: "Faker",
  tagLine: "KR1",
  region: "kr",
  profileIconId: 12,
};
const CHOVY: SearchHit = { puuid: "puuid-chovy", gameName: "Chovy", tagLine: "KR2", region: "kr" };

function hits(list: SearchHit[], isLoading = false): void {
  vi.mocked(usePlayerSearch).mockReturnValue({ hits: list, isLoading });
}

beforeEach(() => {
  vi.clearAllMocks();
  useSearchStore.setState({ recent: [], favorites: [] });
  hits([]);
});

describe("PlayerSearchBar", () => {
  it("lists index hits as you type", async () => {
    hits([FAKER, CHOVY]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "ch");

    expect(screen.getByText("Faker")).toBeInTheDocument();
    expect(screen.getByText("Chovy")).toBeInTheDocument();
  });

  it("exposes each hit as an option the listbox owns", async () => {
    hits([FAKER, CHOVY]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "ch");

    // Nesting the options inside per-section sub-lists hid every one of them from the
    // accessibility tree, so this asserts on the role rather than on the text.
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((o) => o.getAttribute("aria-label"))).toEqual(["Faker#KR1", "Chovy#KR2"]);
  });

  it("walks the list with arrow keys and opens the highlighted player on Enter", async () => {
    hits([FAKER, CHOVY]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    const input = screen.getByRole("combobox");
    await user.type(input, "ch");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(push).toHaveBeenCalledWith("/s/kr/Chovy/KR2");
  });

  it("takes the top match when Enter is pressed with nothing highlighted", async () => {
    hits([FAKER, CHOVY]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "fa{Enter}");

    expect(push).toHaveBeenCalledWith("/s/kr/Faker/KR1");
  });

  it("wraps around at the end of the list", async () => {
    hits([FAKER, CHOVY]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "ch");
    await user.keyboard("{ArrowUp}{Enter}");

    // One step up from nothing highlighted lands on the last row, not off the list.
    expect(push).toHaveBeenCalledWith("/s/kr/Chovy/KR2");
  });

  it("closes on Escape without navigating", async () => {
    hits([FAKER]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "fa");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("offers a direct Riot lookup when the index has never seen the Riot ID", async () => {
    hits([]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "Nobody#XYZ");

    expect(screen.getByText("// Search Riot directly")).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/s/tr1/Nobody/XYZ");
  });

  it("shows favourites and recents before anything is typed", async () => {
    useSearchStore.setState({
      favorites: [{ gameName: "Starred", tagLine: "EUW", region: "euw1" }],
      recent: [{ gameName: "Visited", tagLine: "EUW", region: "euw1" }],
    });
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("// Favorites")).toBeInTheDocument();
    expect(screen.getByText("// Recent")).toBeInTheDocument();
  });

  it("remembers a player once opened", async () => {
    hits([FAKER]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "fa{Enter}");

    expect(useSearchStore.getState().recent[0]).toEqual(
      expect.objectContaining({ gameName: "Faker", tagLine: "KR1", region: "kr" })
    );
  });

  it("stars a player without opening their profile", async () => {
    hits([FAKER]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "fa");
    await user.click(screen.getByRole("button", { name: /add faker to favorites/i }));

    expect(useSearchStore.getState().favorites).toHaveLength(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("says so when a searched name matches nothing", async () => {
    hits([]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "zz");

    expect(screen.getByText("No players found")).toBeInTheDocument();
  });

  // TASK-317: the chip sits inside the bar, so the outside-click handler never fires for it. The
  // suggestions panel used to stay open on top of the menu and swallow the option clicks.
  it("switches region while a query is typed", async () => {
    hits([]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "zz");
    expect(screen.getByText("No players found")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^region:/i }));
    // The panel has to be gone, otherwise it covers the options it is stacked against.
    expect(screen.queryByText("No players found")).not.toBeInTheDocument();

    await user.click(within(screen.getByRole("listbox", { name: "Region" })).getByText("EUW"));

    expect(screen.getByRole("button", { name: /^region: euw$/i })).toBeInTheDocument();
  });

  it("reopens the suggestions on the newly chosen region", async () => {
    hits([FAKER]);
    const user = userEvent.setup();
    render(<PlayerSearchBar />);

    await user.type(screen.getByRole("combobox"), "fa");
    await user.click(screen.getByRole("button", { name: /^region:/i }));
    await user.click(within(screen.getByRole("listbox", { name: "Region" })).getByText("EUW"));

    expect(screen.getByText("Faker")).toBeInTheDocument();
  });
});
