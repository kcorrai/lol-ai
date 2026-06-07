import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import type { AuditEvent } from "@/lib/audit/events";

export interface AuditParams {
  userId?: string;
  actorId?: string;
  action: AuditEvent;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Derives the resource category from the event name prefix (e.g. "riot.account.connected" → "riot")
function resourceFromAction(action: string): string {
  return action.split(".")[0] ?? action;
}

export async function audit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        action: params.action,
        resource: resourceFromAction(params.action),
        resourceId: params.resourceId,
        metadata: params.metadata as object | undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    // Audit failures must never break the main flow — log and continue
    logger.error("[audit] Failed to write audit log", { action: params.action, err });
  }
}

export async function getAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
  },
  page = 0,
  pageSize = 50
) {
  const where = {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.action ? { action: { contains: filters.action } } : {}),
    ...(filters.fromDate || filters.toDate
      ? {
          createdAt: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        actorId: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize };
}
