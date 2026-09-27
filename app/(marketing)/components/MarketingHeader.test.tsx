import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketingHeader } from "./MarketingHeader";

const nav = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
// The real search bar needs the router, the search store and live suggestions; this suite
// only asks whether the header renders one at all.
vi.mock("@/components/search/PlayerSearchBar", () => ({
  PlayerSearchBar: ({ placeholder }: { placeholder?: string }): React.ReactElement => (
    <input placeholder={placeholder} />
  ),
}));

beforeEach(() => {
  nav.pathname = "/";
});

describe("MarketingHeader search", () => {
  it("leaves search to the hero on the landing page", () => {
    render(<MarketingHeader />);
    expect(screen.queryByPlaceholderText("Search a player")).toBeNull();
  });

  it("keeps search in the bar on every other marketing page", () => {
    nav.pathname = "/pricing";
    render(<MarketingHeader />);
    expect(screen.getByPlaceholderText("Search a player")).toBeInTheDocument();
  });
});
