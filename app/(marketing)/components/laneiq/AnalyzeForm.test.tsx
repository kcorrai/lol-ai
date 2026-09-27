import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AnalyzeForm } from "./AnalyzeForm";

// The real search bar pulls in the router, the search store and live suggestions; this suite
// is about the form's own button and messages, so a plain input stands in for it.
vi.mock("@/components/search/PlayerSearchBar", () => ({
  PlayerSearchBar: ({
    query,
    onQueryChange,
  }: {
    query: string;
    onQueryChange: (value: string) => void;
  }): React.ReactElement => (
    <input aria-label="Riot ID" value={query} onChange={(e) => onQueryChange(e.target.value)} />
  ),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AnalyzeForm", () => {
  it("keeps the button live with an empty box", () => {
    // A disabled button read as broken, and left the header as the brightest thing in the hero.
    render(<AnalyzeForm />);
    expect(screen.getByRole("button", { name: /analyze/i })).toBeEnabled();
  });

  it("asks for a Riot ID instead of calling the API when the box is empty", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<AnalyzeForm />);

    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    expect(screen.getByText(/enter your riot id first/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("still rejects an ID without a tag", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<AnalyzeForm />);

    fireEvent.change(screen.getByLabelText("Riot ID"), { target: { value: "Faker" } });
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    expect(screen.getByText("Format: GameName#TAG")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
