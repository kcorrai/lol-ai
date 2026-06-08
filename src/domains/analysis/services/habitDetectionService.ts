import { prisma } from "@/lib/db/prisma";
import { toJsonInput, fromJsonValue } from "@/types/json";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HabitSeverity = "high" | "medium" | "low";

export interface HabitEvidence {
  weekLabel: string;
  value: string;
}

export interface DetectedHabit {
  id: string;
  habitType: string;
  displayName: string;
  severity: HabitSeverity;
  weekCount: number;
  firstDetected: string;
  lastDetected: string;
  isResolved: boolean;
  evidence: HabitEvidence[];
  message: string;
}

// ── Habit catalogue ───────────────────────────────────────────────────────────

const HABIT_META: Record<string, { displayName: string }> = {
  low_vision:        { displayName: "Düşük Vizyon Skoru" },
  high_deaths:       { displayName: "Yüksek Ölüm Sayısı" },
  low_cs:            { displayName: "Düşük CS / Dakika" },
  late_game_throw:   { displayName: "Geç Oyun Hatası" },
  tilt_prone:        { displayName: "Tilt Eğilimi" },
  objective_neglect: { displayName: "Amaç İhmali" },
};

// weakestArea values coming from PerformanceSnapshot → habit type mapping
const WEAK_AREA_TO_HABIT: Record<string, string> = {
  vision_control:    "low_vision",
  death_reduction:   "high_deaths",
  cs_farming:        "low_cs",
};

function severityFor(weekCount: number): HabitSeverity {
  if (weekCount >= 3) return "high";
  return "medium";
}

function habitMessage(displayName: string, weekCount: number): string {
  return `${displayName} problemi son ${weekCount} haftadır devam ediyor.`;
}

// ── Core detection logic ──────────────────────────────────────────────────────

interface SnapshotRow {
  id: string;
  periodEnd: Date;
  weakestArea: string | null;
  tiltScore: unknown;
  gamesAnalyzed: number;
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

async function detectCandidates(
  snapshots: SnapshotRow[]
): Promise<{ habitType: string; weekCount: number; evidence: HabitEvidence[] }[]> {
  const candidates: { habitType: string; weekCount: number; evidence: HabitEvidence[] }[] = [];

  // 1. Recurring weakestArea
  const weakAreaCounts = new Map<string, HabitEvidence[]>();
  for (const s of snapshots) {
    if (!s.weakestArea) continue;
    const habitType = WEAK_AREA_TO_HABIT[s.weakestArea];
    if (!habitType) continue;
    const list = weakAreaCounts.get(habitType) ?? [];
    list.push({ weekLabel: weekLabel(s.periodEnd), value: s.weakestArea });
    weakAreaCounts.set(habitType, list);
  }
  for (const [habitType, ev] of weakAreaCounts.entries()) {
    if (ev.length >= 2) {
      candidates.push({ habitType, weekCount: ev.length, evidence: ev });
    }
  }

  // 2. Persistent tilt
  const tiltScores = snapshots
    .map((s) => Number(s.tiltScore ?? 0))
    .filter((v) => v > 0);
  if (tiltScores.length >= 2) {
    const avg = tiltScores.reduce((a, b) => a + b, 0) / tiltScores.length;
    if (avg > 60) {
      candidates.push({
        habitType: "tilt_prone",
        weekCount: tiltScores.length,
        evidence: snapshots
          .filter((s) => Number(s.tiltScore ?? 0) > 0)
          .map((s) => ({
            weekLabel: weekLabel(s.periodEnd),
            value: `tilt skoru ${Math.round(Number(s.tiltScore ?? 0))}`,
          })),
      });
    }
  }

  return candidates;
}

// ── Upsert logic ──────────────────────────────────────────────────────────────

async function upsertHabits(
  riotAccountId: string,
  candidates: { habitType: string; weekCount: number; evidence: HabitEvidence[] }[]
): Promise<void> {
  const now = new Date();

  for (const c of candidates) {
    const existing = await prisma.playerHabit.findFirst({
      where: { riotAccountId, habitType: c.habitType, isResolved: false },
    });

    if (existing) {
      await prisma.playerHabit.update({
        where: { id: existing.id },
        data: {
          weekCount: c.weekCount,
          lastDetected: now,
          severity: severityFor(c.weekCount),
          evidence: toJsonInput(c.evidence),
        },
      });
    } else {
      await prisma.playerHabit.create({
        data: {
          riotAccountId,
          habitType: c.habitType,
          severity: severityFor(c.weekCount),
          weekCount: c.weekCount,
          firstDetected: now,
          lastDetected: now,
          evidence: toJsonInput(c.evidence),
        },
      });
    }
  }
}

async function resolveStaleHabits(
  riotAccountId: string,
  activeHabitTypes: Set<string>
): Promise<void> {
  const unresolved = await prisma.playerHabit.findMany({
    where: { riotAccountId, isResolved: false },
    select: { id: true, habitType: true },
  });

  const toResolve = unresolved.filter((h) => !activeHabitTypes.has(h.habitType));
  if (toResolve.length === 0) return;

  await prisma.playerHabit.updateMany({
    where: { id: { in: toResolve.map((h) => h.id) } },
    data: { isResolved: true, resolvedAt: new Date() },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

function toDto(h: {
  id: string;
  habitType: string;
  severity: string;
  weekCount: number;
  firstDetected: Date;
  lastDetected: Date;
  isResolved: boolean;
  evidence: unknown;
}): DetectedHabit {
  const meta = HABIT_META[h.habitType] ?? { displayName: h.habitType };
  return {
    id: h.id,
    habitType: h.habitType,
    displayName: meta.displayName,
    severity: h.severity as HabitSeverity,
    weekCount: h.weekCount,
    firstDetected: h.firstDetected.toISOString(),
    lastDetected: h.lastDetected.toISOString(),
    isResolved: h.isResolved,
    evidence: fromJsonValue<HabitEvidence[]>(h.evidence),
    message: habitMessage(meta.displayName, h.weekCount),
  };
}

export async function detectAndPersistHabits(riotAccountId: string): Promise<void> {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const snapshots = await prisma.performanceSnapshot.findMany({
    where: {
      riotAccountId,
      gamesAnalyzed: { gte: 5 },
      periodEnd: { gte: fourWeeksAgo },
    },
    orderBy: { periodEnd: "desc" },
    take: 4,
    select: {
      id: true,
      periodEnd: true,
      weakestArea: true,
      tiltScore: true,
      gamesAnalyzed: true,
    },
  });

  if (snapshots.length < 2) return;

  const candidates = await detectCandidates(snapshots);
  await upsertHabits(riotAccountId, candidates);
  await resolveStaleHabits(
    riotAccountId,
    new Set(candidates.map((c) => c.habitType))
  );
}

export async function getActiveHabits(riotAccountId: string): Promise<DetectedHabit[]> {
  const habits = await prisma.playerHabit.findMany({
    where: { riotAccountId, isResolved: false },
    orderBy: [{ severity: "asc" }, { weekCount: "desc" }],
  });

  return habits.map(toDto);
}
