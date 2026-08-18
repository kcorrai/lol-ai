import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
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

beforeEach(() => {
  vi.clearAllMocks();
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
});
