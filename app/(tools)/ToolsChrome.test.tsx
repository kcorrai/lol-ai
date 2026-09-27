import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQueryClient } from "@tanstack/react-query";

// TASK-308: the draft room is a public tool that uses React Query, so the signed-out branch must
// mount a provider too. LA-112: the choice of chrome now happens here, in the browser, so the
// layout above it can stay static.

const auth = vi.hoisted(() => ({ isAuthenticated: false }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/components/layout/ToolsAppChrome", async () => {
  const { QueryProvider } = await import("@/components/providers/QueryProvider");
  return {
    ToolsAppChrome: ({ children }: { children: React.ReactNode }) => (
      <QueryProvider>
        <div data-testid="app-shell">{children}</div>
      </QueryProvider>
    ),
  };
});

import { ToolsChrome } from "./ToolsChrome";

/** A tool that needs a QueryClient, the way the draft room does. */
function NeedsQueryClient(): React.ReactElement {
  useQueryClient();
  return <span>tool</span>;
}

function renderChrome() {
  return render(
    <ToolsChrome
      header={<header>marketing header</header>}
      footer={<footer>marketing footer</footer>}
    >
      <NeedsQueryClient />
    </ToolsChrome>
  );
}

beforeEach(() => {
  auth.isAuthenticated = false;
});

describe("ToolsChrome", () => {
  it("wraps a signed-out visitor's tool in the marketing chrome, with a QueryClient", () => {
    renderChrome();

    expect(screen.getByText("tool")).toBeInTheDocument();
    expect(screen.getByText("marketing header")).toBeInTheDocument();
    expect(screen.getByText("marketing footer")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).toBeNull();
  });

  it("gives a signed-in visitor the app shell instead", () => {
    auth.isAuthenticated = true;
    renderChrome();

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("tool")).toBeInTheDocument();
    expect(screen.queryByText("marketing header")).toBeNull();
  });
});

describe("tools layout", () => {
  it("never reads the session on the server, so its pages can be static", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(`${__dirname}/layout.tsx`, "utf8")
    );
    expect(source).not.toMatch(/getSession|getServerSession|cookies\(|headers\(/);
  });
});
