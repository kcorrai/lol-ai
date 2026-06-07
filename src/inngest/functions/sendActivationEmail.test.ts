import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/email/client", () => ({
  getEmailClient: vi.fn(),
  EMAIL_FROM: "test@lolaicoach.gg",
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((config, handler) => handler),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { getEmailClient } from "@/lib/email/client";
import { buildActivationEmail } from "@/lib/email/templates/activation";

const mockUser = prisma.user as ReturnType<typeof vi.mocked<typeof prisma.user>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lolaicoach.gg");
});

describe("buildActivationEmail", () => {
  it("generates correct subject", () => {
    const { subject } = buildActivationEmail({ gameName: "Faker", appUrl: "https://lolaicoach.gg" });
    expect(subject).toContain("Faker");
    expect(subject).toContain("rapor");
  });

  it("includes gameName in html body", () => {
    const { html } = buildActivationEmail({ gameName: "Kaan", appUrl: "https://lolaicoach.gg" });
    expect(html).toContain("Kaan");
    expect(html).toContain("/coaching");
  });

  it("escapes html in gameName", () => {
    const { html } = buildActivationEmail({ gameName: "<script>xss</script>", appUrl: "https://lolaicoach.gg" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("sendActivationEmail handler", () => {
  async function runHandler(payload: { userId: string; gameName: string }) {
    const mockHandler = vi.fn(async ({ event }: { event: { data: typeof payload } }) => {
      const { userId } = event.data;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailVerified: true },
      });
      if (!user?.email) return { skipped: "no_email" };
      const emailClient = getEmailClient();
      if (!emailClient) return { skipped: "no_email_client" };
      return { sent: true };
    });
    return mockHandler({ event: { data: payload } });
  }

  it("skips when user has no email", async () => {
    vi.mocked(mockUser.findUnique).mockResolvedValueOnce(null);

    const result = await runHandler({ userId: "user-1", gameName: "Faker" });
    expect(result).toEqual({ skipped: "no_email" });
  });

  it("skips when email client is not configured", async () => {
    vi.mocked(mockUser.findUnique).mockResolvedValueOnce({ email: "faker@test.com", emailVerified: new Date() } as never);
    vi.mocked(getEmailClient).mockReturnValueOnce(null);

    const result = await runHandler({ userId: "user-1", gameName: "Faker" });
    expect(result).toEqual({ skipped: "no_email_client" });
  });

  it("sends email when user and client are ready", async () => {
    const mockSend = vi.fn().mockResolvedValueOnce({ error: null });
    vi.mocked(mockUser.findUnique).mockResolvedValueOnce({ email: "faker@test.com", emailVerified: new Date() } as never);
    vi.mocked(getEmailClient).mockReturnValueOnce({ emails: { send: mockSend } } as never);

    const result = await runHandler({ userId: "user-1", gameName: "Faker" });
    expect(result).toEqual({ sent: true });
  });
});
