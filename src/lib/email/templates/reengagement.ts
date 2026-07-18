import { escapeHtml, renderEmailShell } from "./emailShell";

export type NudgeType =
  | "stop_queuing"
  | "pool_too_wide"
  | "loss_streak"
  | "death_spike"
  | "cs_drop"
  | "generic";

interface ReengagementEmailData {
  gameName: string;
  nudge: NudgeType;
  lossStreak?: number;
  appUrl: string;
}

interface NudgeCopy {
  subject: string;
  headline: string;
  body: string;
  cta: string;
}

function getNudgeCopy(nudge: NudgeType, gameName: string, lossStreak?: number): NudgeCopy {
  const name = escapeHtml(gameName);

  switch (nudge) {
    case "stop_queuing":
      return {
        subject: "Hold up — your data shows you're tilting",
        headline: "Tilt Alert",
        body: `${name}, we noticed you're queuing again right after losing your last matches. This is a classic tilt cycle. Your coach has analyzed this and has a solution ready.`,
        cta: "See Coach Analysis",
      };
    case "loss_streak":
      return {
        subject: `You have a ${lossStreak ?? "few"}-game losing streak — your coach knows why`,
        headline: `${lossStreak ?? "Multi"}-Game Loss`,
        body: `${name}, you're experiencing a ${lossStreak ?? "few"}-game losing streak. This happens to everyone — what matters is learning the right lesson. Your AI coach is waiting for you.`,
        cta: "Get Analysis Report",
      };
    case "pool_too_wide":
      return {
        subject: "You're playing too many champions — focus and climb",
        headline: "Champion Pool Too Wide",
        body: `${name}, you played many different champions in your last 20 matches. Research shows that focusing on 2-3 champions is the fastest way to climb rank. Your coach tells you which champions you should focus on.`,
        cta: "Review Champion Pool",
      };
    case "death_spike":
      return {
        subject: "Your deaths increased in recent matches — let's fix this",
        headline: "Death Spike Detected",
        body: `${name}, your death count in the last few matches is above your average. This usually means you're repeating a specific mistake. Your coach has analyzed exactly what you need to do differently.`,
        cta: "See Coach Analysis",
      };
    case "cs_drop":
      return {
        subject: "Your CS/min dropped — a small fix creates a big difference",
        headline: "Your CS Performance is Declining",
        body: `${name}, this week your CS/min average is below last week. CS loss is usually invisible LP loss. Your coach prepared a laning exercise just for you.`,
        cta: "See Coach Analysis",
      };
    case "generic":
    default:
      return {
        subject: `${name}, we haven't seen you in a week — what's going on?`,
        headline: "We Miss You",
        body: `${name}, you haven't logged in for a few days. There might be new match data in your account — your coach is always ready to analyze.`,
        cta: "Back to Dashboard",
      };
  }
}

export function buildReengagementEmail(data: ReengagementEmailData): { subject: string; html: string } {
  const copy = getNudgeCopy(data.nudge, data.gameName, data.lossStreak);
  const safeUrl = escapeHtml(data.appUrl);

  const ctaHref =
    data.nudge === "pool_too_wide"
      ? `${safeUrl}/champions`
      : `${safeUrl}/dashboard`;

  const contentHtml = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#C89B3C;">
                ${escapeHtml(copy.headline)}
              </h1>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#A0AEC0;">
                ${escapeHtml(copy.body)}
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${ctaHref}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      ${escapeHtml(copy.cta)} →
                    </a>
                  </td>
                </tr>
              </table>`;

  return {
    subject: copy.subject,
    html: renderEmailShell({ title: copy.subject, contentHtml, appUrl: data.appUrl, unsubscribe: true }),
  };
}
