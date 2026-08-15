import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

// TASK-308: the draft room is the first public tool to use React Query, and the
// anonymous branch of this layout did not mount a provider — so the whole room
// rendered as "No QueryClient set". Nothing caught it: component tests mock the
// hooks and route tests mock the service, so no test had ever rendered a public
// tool inside its real layout.

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("../(marketing)/components/MarketingHeader", () => ({
  MarketingHeader: () => null,
}));
vi.mock("../(marketing)/components/MarketingFooter", () => ({
  MarketingFooter: () => null,
}));
vi.mock("@/components/layout/ToolsAppChrome", () => ({
  ToolsAppChrome: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { getSession } from "@/lib/auth/session";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToolsAppChrome } from "@/components/layout/ToolsAppChrome";
import ToolsLayout from "./layout";

/** Every component type in the rendered tree, so nesting is visible. */
function componentTypes(node: unknown, found: unknown[] = []): unknown[] {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    for (const child of node) componentTypes(child, found);
    return found;
  }
  const element = node as ReactElement & { props?: { children?: unknown } };
  if (element.type) found.push(element.type);
  if (element.props?.children) componentTypes(element.props.children, found);
  return found;
}

async function renderLayout(): Promise<unknown[]> {
  const tree = await ToolsLayout({ children: <span>tool</span> });
  return componentTypes(tree);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tools layout", () => {
  it("mounts a QueryClient for signed-out visitors", async () => {
    vi.mocked(getSession).mockResolvedValue(null as never);
    expect(await renderLayout()).toContain(QueryProvider);
  });

  it("mounts a QueryClient for signed-in visitors", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "u1" } } as never);
    const types = await renderLayout();
    // The signed-in branch gets its provider from ToolsAppChrome.
    expect(types).toContain(ToolsAppChrome);
  });

  it("never nests two providers on the same page", async () => {
    for (const session of [null, { user: { id: "u1" } }]) {
      vi.mocked(getSession).mockResolvedValue(session as never);
      const providers = (await renderLayout()).filter((t) => t === QueryProvider);
      // Two clients on one page means two caches, which is a subtler bug than
      // the missing provider this test exists for.
      expect(providers.length).toBeLessThanOrEqual(1);
    }
  });
});
