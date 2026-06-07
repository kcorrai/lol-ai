import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { audit, getAuditLogs } from "@/lib/audit/auditService";

// Cast to get vi.fn() methods accessible without TS errors
const mockCreate = prisma.auditLog.create as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.auditLog.findMany as ReturnType<typeof vi.fn>;
const mockCount = prisma.auditLog.count as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("audit", () => {
  it("DB'ye audit log kaydı oluşturuyor", async () => {
    mockCreate.mockResolvedValue({});

    await audit({ userId: "user-1", action: "riot.account.connected", resourceId: "acc-1" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          action: "riot.account.connected",
          resource: "riot",
          resourceId: "acc-1",
        }),
      })
    );
  });

  it("userId null olsa bile kayıt oluşturuluyor (anonim işlemler)", async () => {
    mockCreate.mockResolvedValue({});

    await audit({ action: "auth.login.failed", ipAddress: "1.2.3.4" });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: undefined, action: "auth.login.failed" }),
      })
    );
  });

  it("DB hatası ana akışı bozmıyor (silent catch)", async () => {
    mockCreate.mockRejectedValue(new Error("DB down"));

    await expect(audit({ userId: "u-1", action: "report.generated" })).resolves.toBeUndefined();
  });
});

describe("getAuditLogs", () => {
  it("filtreli audit log listesi döndürüyor", async () => {
    const mockLogs = [{ id: "log-1", action: "auth.login", createdAt: new Date() }];
    mockFindMany.mockResolvedValue(mockLogs);
    mockCount.mockResolvedValue(1);

    const result = await getAuditLogs({ userId: "user-1" });

    expect(result.total).toBe(1);
    expect(result.logs).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user-1" }) })
    );
  });
});
