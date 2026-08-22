import { test, expect, type Page } from "@playwright/test";
import { createTestPrisma } from "./helpers/db";
import { E2E_USER } from "./helpers/constants";
import { GUIDE_STEPS, type GuideStep } from "@/domains/onboarding/guide/guideSteps";

// Keep in sync with GUIDE_STORAGE_KEY in src/domains/onboarding/guide/guideSteps.ts
const GUIDE_KEY = "lolai_first_journey_v1";

// The tour is data: `GUIDE_STEPS` decides how many steps there are, which ones
// wait on a gate, and which ones need a click on the page rather than in the
// bubble. This spec reads that same list instead of hard-coding a path through
// it — the previous version spelled out eight steps and went red the moment the
// tour grew past them, which says nothing about whether onboarding works.
//
// The seeded user already has an account, matches and a completed report, so
// the gated steps fast-forward. What is asserted is that the journey never
// stalls and that finishing sets the bypass-proof DB gate.

/**
 * The bubble is the one element carrying the "Skip setup" escape hatch — except
 * on the final step, which drops it (there is nothing left to skip) and offers
 * "Start climbing" instead. Both spellings, or the walk goes blind exactly where
 * it is supposed to finish.
 */
function bubble(page: Page) {
  // Innermost div holding both the title and the button. Filtering on the
  // button alone picks the button's own wrapper on the final step, where
  // "Start climbing" sits two levels deeper than "Skip setup" ever did.
  return page
    .locator("div")
    .filter({ has: page.locator("h3") })
    .filter({ has: page.getByRole("button", { name: /Skip setup|Start climbing/ }) })
    .last();
}

async function visibleTitle(page: Page): Promise<string | null> {
  const b = bubble(page);
  if (!(await b.isVisible().catch(() => false))) return null;
  // Short budget on purpose: this runs in a poll loop, so a locator that has
  // stopped matching must fail fast rather than eat the whole test timeout.
  return (await b.locator("h3").first().innerText({ timeout: 2_000 }).catch(() => "")).trim() || null;
}

/**
 * Resolve a title to a step. Two steps share the title "Your champion pool", so
 * the search starts after the step we were last on rather than at the top —
 * otherwise the walk snaps backwards and loops.
 */
function stepAfter(title: string, from: number): { step: GuideStep; index: number } | null {
  for (let i = from + 1; i < GUIDE_STEPS.length; i += 1) {
    if (GUIDE_STEPS[i].title.trim() === title) return { step: GUIDE_STEPS[i], index: i };
  }
  return null;
}

async function waitForNextStep(
  page: Page,
  from: number,
  previousTitle: string | null,
  budgetMs = 25_000,
): Promise<{ step: GuideStep; index: number }> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    const title = await visibleTitle(page);
    if (title && title !== previousTitle) {
      const found = stepAfter(title, from);
      if (found) return found;
    }
    await page.waitForTimeout(200);
  }
  throw new Error(`the journey never advanced past "${previousTitle ?? "(start)"}"`);
}

async function click(page: Page, step: GuideStep, force = false): Promise<void> {
  const control =
    step.advance.type === "manual"
      ? page.getByRole("button", { name: /Let's go|Got it/ })
      : step.advance.type === "route" && step.goTo
        ? page.getByRole("button", { name: /Take me there/ })
        : step.advance.type === "route"
          ? // No safety valve on this one: the point is that the spotlighted
            // control on the page is what moves the journey on.
            page.locator(`[data-tour="${step.target}"]`).first()
          : null;

  if (!control) return;
  // The spotlighted control can be a row the page is still fetching — the match
  // list on the dashboard is a client query, and under load it arrives after the
  // bubble does. Wait for it before clicking, or the walk gives up on a step
  // that was about to work.
  await control.waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);
  await control.click({ timeout: 8_000, force }).catch(() => undefined);
}

test.describe("Forced first-journey onboarding", () => {
  // A full walk of the tour is a few dozen page loads under `next dev`, each
  // paying its own first compile.
  test.setTimeout(300_000);

  test.beforeEach(async () => {
    const prisma = createTestPrisma();
    try {
      await prisma.profile.updateMany({
        where: { user: { email: E2E_USER.email } },
        data: { onboardingCompletedAt: null },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  // Put the gate back even when the test above fails partway. Opening the forced
  // journey is a change to the shared seeded account, and an unfinished tour leaves
  // a full-screen overlay on every page: `riot.spec` and `share.spec` then fail on
  // clicks that land on the backdrop instead of the control, which reads as seven
  // broken features rather than one test that did not clean up after itself.
  test.afterEach(async () => {
    const prisma = createTestPrisma();
    try {
      await prisma.profile.updateMany({
        where: { user: { email: E2E_USER.email } },
        data: { onboardingCompletedAt: new Date() },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test("drives the user across pages and completion is persisted", async ({ page }) => {
    await page.goto("/dashboard");
    await page.evaluate((k) => localStorage.removeItem(k), GUIDE_KEY);
    await page.reload();

    let current = await waitForNextStep(page, -1, null);
    const walked: string[] = [];

    for (;;) {
      const { step, index } = current;
      walked.push(step.id);

      if (step.isFinal) {
        await page.getByRole("button", { name: /Start climbing/ }).click();
        break;
      }

      // A `skipIfMissing` step auto-advances 700ms after it appears, so the
      // control can be torn out from under the click. That is the journey
      // working, not a failure — swallow it and let the waits below decide,
      // which report "never advanced past X" instead of retrying for the whole
      // test timeout.
      //
      // The click is tried twice because the spotlight is a fixed overlay that
      // re-measures its hole every frame: scrolling the control into view moves
      // the hole, and a click that lands during that frame hits the dim panel
      // instead of the control. A second attempt, once both have settled, is
      // what a person does too.
      await click(page, step);
      // A `state` step has no control at all — the engine advances it when the
      // gate flips, and the wait below is the assertion that it does.
      let next = await waitForNextStep(page, index, step.title, 8_000).catch(() => null);
      if (!next) {
        // Forced on the retry: the spotlight is a fixed overlay whose dim panels
        // sit above the page, and scrolling the control into view can leave one
        // of them over it for a frame. Playwright then reports the panel as the
        // receiver and waits it out. The click still lands on the real control.
        await click(page, step, true);
        next = await waitForNextStep(page, index, step.title);
      }

      current = next;
    }

    // The tour really walked; it did not fast-forward from welcome to finish.
    expect(walked.length).toBeGreaterThan(5);
    expect(walked[0]).toBe("welcome");
    expect(walked.at(-1)).toBe(GUIDE_STEPS.at(-1)?.id);

    // Overlay is gone and the gate is persisted server-side.
    await expect(page.getByText("You're all set!")).toBeHidden({ timeout: 10_000 });

    const prisma = createTestPrisma();
    try {
      const profile = await prisma.profile.findFirst({
        where: { user: { email: E2E_USER.email } },
        select: { onboardingCompletedAt: true },
      });
      expect(profile?.onboardingCompletedAt).not.toBeNull();
    } finally {
      await prisma.$disconnect();
    }
  });
});
