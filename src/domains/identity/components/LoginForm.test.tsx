import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

/** The query string the form is rendered with. Set by `renderWith` before each render. */
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => searchParams,
}));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

import { signIn } from "next-auth/react";
import { LoginForm } from "./LoginForm";

async function submit(): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "player@example.com");
  await user.type(screen.getByLabelText("Password"), "hunter2hunter2");
  await user.click(screen.getByRole("button", { name: /^Log in$/ }));
}

/**
 * Re-render the form with a query string on it.
 *
 * `beforeEach` has already mounted a bare one — that is what most of these tests want — so
 * this clears it first rather than leaving two forms on the screen for the queries to match.
 */
function renderWith(query: string): void {
  cleanup();
  searchParams = new URLSearchParams(query);
  render(<LoginForm />);
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  render(<LoginForm />);
});

describe("LoginForm", () => {
  it("sends the reader on to the dashboard when the sign-in takes", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: "http://localhost/login",
    } as never);

    await submit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("names a wrong password as one", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      ok: true,
      status: 401,
      url: null,
    } as never);

    await submit();

    expect(await screen.findByText(/Email or password is incorrect/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  // A CSRF mismatch is answered with 200, `ok: true` and no error at all — only the
  // url gives it away. Read as success it pushes to /dashboard, middleware bounces
  // the visitor back to /login, and nothing on the page says why.
  it("does not read a CSRF bounce as a successful login", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: "http://localhost/api/auth/signin?csrf=true",
    } as never);

    await submit();

    expect(await screen.findByText(/login session expired/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
  // Middleware puts the interrupted destination on the query string when it bounces a
  // signed-out visitor off a guarded page, and the register form puts a Riot ID claim there.
  // This form used to push /dashboard unconditionally, which threw both away: a desktop
  // pairing approval, a team invite and the claim all landed on an empty dashboard instead.
  it("returns the reader to the page the login wall interrupted", async () => {
    renderWith("callbackUrl=%2Fsettings%2Fdesktop%2Fapprove%3Frequest%3Dabc");
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: "http://localhost/login",
    } as never);

    await submit();

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/settings/desktop/approve?request=abc")
    );
  });

  // The parameter is attacker-supplied, so an absolute one would make our own login form the
  // front half of a phishing redirect. `safeCallbackUrl` covers the shapes; this is the wiring.
  it("will not be sent off-site by the callbackUrl", async () => {
    renderWith("callbackUrl=https%3A%2F%2Fevil.example");
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: "http://localhost/login",
    } as never);

    await submit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });
});
