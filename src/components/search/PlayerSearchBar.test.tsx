import { render, screen } from "@testing-library/react";
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
      expect.objectContaining({ gameName: "Faker", tagLine: "KR1", region: "kr" }),
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
});
