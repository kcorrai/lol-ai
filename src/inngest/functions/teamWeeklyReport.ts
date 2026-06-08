import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { getEmailClient } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";

// Fires every Monday at 09:30 UTC — 30 minutes after individual weekly reports
// so DB is warmed up with fresh stats.
export const teamWeeklyReport = inngest.createFunction(
  {
    id: "team-weekly-report",
    triggers: [{ cron: "30 9 * * 1" }],
    retries: 2,
  },
  async () => {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // All teams with at least one member who has a Riot account
    const teams = await prisma.team.findMany({
      include: {
        members: {
          where: { role: { in: ["OWNER", "COACH"] } },
          include: { user: { select: { email: true, name: true } } },
        },
      },
    });

    let sent = 0;

    for (const team of teams) {
      // Get member stats for the past 7 days
      const memberStats = await prisma.riotAccount.findMany({
        where: {
          user: {
            teamMemberships: { some: { teamId: team.id } },
          },
        },
        select: {
          gameName: true,
          matchParticipants: {
            where: { match: { gameStart: { gte: since7d } } },
            select: { won: true, kills: true, deaths: true, assists: true, csPerMinute: true },
          },
        },
      });

      if (memberStats.length === 0) continue;

      const rows = memberStats
        .filter((m) => m.matchParticipants.length > 0)
        .map((m) => {
          const games = m.matchParticipants.length;
          const wins = m.matchParticipants.filter((p) => p.won).length;
          const sumKDA = m.matchParticipants.reduce((s, p) => s + (p.kills + p.assists) / Math.max(p.deaths, 1), 0);
          return {
            gameName: m.gameName,
            games,
            winRate: Math.round((wins / games) * 100),
            avgKDA: parseFloat((sumKDA / games).toFixed(2)),
          };
        })
        .sort((a, b) => b.winRate - a.winRate);

      if (rows.length === 0) continue;

      const tableRows = rows
        .map((r) => `<tr><td style="padding:4px 12px">${r.gameName}</td><td style="padding:4px 12px;text-align:center">${r.games}</td><td style="padding:4px 12px;text-align:center;font-weight:600;color:${r.winRate >= 55 ? "#4ade80" : r.winRate < 45 ? "#f87171" : "#d1d5db"}">${r.winRate}%</td><td style="padding:4px 12px;text-align:center">${r.avgKDA}</td></tr>`)
        .join("");

      const html = `
<h2 style="font-family:sans-serif">${team.name} — Haftalık Rapor</h2>
<p style="font-family:sans-serif;color:#9ca3af">Son 7 günlük takım performans özeti</p>
<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
  <thead><tr style="background:#1f2937;color:#9ca3af">
    <th style="padding:8px 12px;text-align:left">Oyuncu</th>
    <th style="padding:8px 12px;text-align:center">Maç</th>
    <th style="padding:8px 12px;text-align:center">WR</th>
    <th style="padding:8px 12px;text-align:center">KDA</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>`;

      // Send to all coaches/owners
      const recipients = team.members
        .map((m) => m.user?.email)
        .filter((e): e is string => !!e);

      const resend = getEmailClient();
      for (const email of recipients) {
        if (!resend) break;
        await resend.emails.send({
          from: "LoL AI Coach <noreply@lolaicoach.gg>",
          to: email,
          subject: `${team.name} Haftalık Rapor`,
          html,
        }).catch(() => {});
        sent++;
      }
    }

    logger.info("[team-weekly-report] done", { teamCount: teams.length, emailsSent: sent });
    return { teamCount: teams.length, emailsSent: sent };
  }
);
