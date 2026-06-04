import { PrismaClient } from "@prisma/client";

// Singleton Prisma client for E2E test helpers.
// Uses E2E_DATABASE_URL when available, otherwise falls back to DATABASE_URL.
// This client runs in the Playwright process (not the Next.js server process).
export function createTestPrisma(): PrismaClient {
  const url = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Neither E2E_DATABASE_URL nor DATABASE_URL is set");
  return new PrismaClient({ datasources: { db: { url } } });
}

export function readStateFile(stateFile: string): E2EState {
  const { readFileSync } = require("fs") as typeof import("fs");
  return JSON.parse(readFileSync(stateFile, "utf-8")) as E2EState;
}

export interface E2EState {
  userId: string;
  riotAccountId: string;
  reportId: string;
  matchIds: string[];
  shareToken: string;
}
