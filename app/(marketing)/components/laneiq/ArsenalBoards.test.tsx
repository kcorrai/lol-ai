import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EsportsVisual } from "./ArsenalBoards";

describe("EsportsVisual", () => {
  it("does not claim its fixed scores are live", () => {
    render(<EsportsVisual />);
    expect(screen.queryByText(/live now/i)).toBeNull();
    expect(screen.queryByText(/●/)).toBeNull();
    expect(screen.getByText(/illustration/i)).toBeInTheDocument();
  });
});
