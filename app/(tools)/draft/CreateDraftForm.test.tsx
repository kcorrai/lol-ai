import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/useCreateDraft", () => ({ useCreateDraft: vi.fn() }));
vi.mock("@/hooks/useAllChampions", () => ({ useAllChampions: () => ({ data: [] }) }));

import { useCreateDraft } from "@/hooks/useCreateDraft";
import { CreateDraftForm } from "./CreateDraftForm";

const mutate = vi.fn();

function mutation(overrides: Record<string, unknown> = {}) {
  return { mutate, isPending: false, isError: false, error: null, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCreateDraft).mockReturnValue(mutation() as never);
});

describe("CreateDraftForm", () => {
  it("submits the defaults without any input", async () => {
    render(<CreateDraftForm />);
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        team1Name: "Team 1",
        team2Name: "Team 2",
        mode: "NORMAL",
        gameCount: 1,
        timerSeconds: 30,
        disabledChampions: [],
      },
      expect.anything()
    );
  });

  it("carries the chosen format, length and timer through", async () => {
    render(<CreateDraftForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /Fearless[\s\S]*locked out for both teams/ })
    );
    await userEvent.click(screen.getByRole("button", { name: "5" }));
    await userEvent.click(screen.getByRole("button", { name: "Untimed" }));
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "FEARLESS", gameCount: 5, timerSeconds: 0 }),
      expect.anything()
    );
  });

  it("explains what each format carries between games", () => {
    render(<CreateDraftForm />);
    expect(screen.getByText("Every game starts from the full champion pool.")).toBeInTheDocument();
    expect(
      screen.getByText("A champion picked in an earlier game is locked out for both teams.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Each team loses only its own earlier picks. The enemy may still take them.")
    ).toBeInTheDocument();
  });

  it("falls back to a default name rather than submitting a blank one", async () => {
    render(<CreateDraftForm />);
    const input = screen.getByLabelText("Team 1 name");
    await userEvent.clear(input);
    await userEvent.click(screen.getByRole("button", { name: "Create draft" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ team1Name: "Team 1" }),
      expect.anything()
    );
  });

  it("marks the selected format for assistive tech", async () => {
    render(<CreateDraftForm />);
    const normal = screen.getByRole("button", { name: /Normal[\s\S]*full champion pool/ });
    expect(normal).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: /Team Fearless/ }));
    expect(normal).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the failure instead of leaving the button spinning", () => {
    vi.mocked(useCreateDraft).mockReturnValue(
      mutation({ isError: true, error: new Error("Too many requests") }) as never
    );
    render(<CreateDraftForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("Too many requests");
  });

  it("disables the button while the request is in flight", () => {
    vi.mocked(useCreateDraft).mockReturnValue(mutation({ isPending: true }) as never);
    render(<CreateDraftForm />);
    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
  });
});
