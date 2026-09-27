import { afterEach, describe, expect, it } from "vitest";
import { revealOnClick } from "@/domains/esports/components/SpoilerToggle";
import { SPOILER_PREPAINT_SCRIPT } from "@/domains/esports/spoilerScript";

function click(target: Element): MouseEvent {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "target", { value: target });
  revealOnClick(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-hide-scores");
  localStorage.clear();
});

describe("revealOnClick", () => {
  function row(): { scope: Element; score: Element; other: Element } {
    document.body.innerHTML = `
      <a href="/esports/matches/1" data-spoiler-scope id="scope"><span data-spoiler id="score">3–0</span></a>
      <a href="/esports/matches/2" data-spoiler-scope><span data-spoiler id="other">1–2</span></a>`;
    return {
      scope: document.getElementById("scope")!,
      score: document.getElementById("score")!,
      other: document.getElementById("other")!,
    };
  }

  it("reveals the clicked result's row, and only that row, without following the link", () => {
    document.documentElement.setAttribute("data-hide-scores", "true");
    const { scope, score, other } = row();

    const event = click(score);

    expect(event.defaultPrevented).toBe(true);
    expect(scope.hasAttribute("data-revealed")).toBe(true);
    expect(other.closest("[data-spoiler-scope]")!.hasAttribute("data-revealed")).toBe(false);
  });

  it("leaves clicks alone when scores are shown", () => {
    const { scope, score } = row();

    const event = click(score);

    expect(event.defaultPrevented).toBe(false);
    expect(scope.hasAttribute("data-revealed")).toBe(false);
  });

  it("lets an already revealed result's link work", () => {
    document.documentElement.setAttribute("data-hide-scores", "true");
    const { scope, score } = row();
    scope.setAttribute("data-revealed", "");

    expect(click(score).defaultPrevented).toBe(false);
  });

  it("opens the block a placeholder's button stands in for", () => {
    document.documentElement.setAttribute("data-hide-scores", "true");
    document.body.innerHTML = `
      <div data-spoiler-block id="block"></div>
      <div data-spoiler-placeholder><button data-spoiler-reveal id="show">Show</button></div>`;

    click(document.getElementById("show")!);

    expect(document.getElementById("block")!.hasAttribute("data-revealed")).toBe(true);
  });
});

describe("SPOILER_PREPAINT_SCRIPT", () => {
  const run = (): void => new Function(SPOILER_PREPAINT_SCRIPT)();

  it("hides scores before paint for a reader who chose to", () => {
    localStorage.setItem(
      "lol-ai-esports-prefs",
      JSON.stringify({ state: { hideScores: true, timeZone: null }, version: 0 })
    );
    run();
    expect(document.documentElement.getAttribute("data-hide-scores")).toBe("true");
  });

  it("does nothing without a saved choice, or with a corrupt one", () => {
    run();
    expect(document.documentElement.hasAttribute("data-hide-scores")).toBe(false);
    localStorage.setItem("lol-ai-esports-prefs", "{not json");
    run();
    expect(document.documentElement.hasAttribute("data-hide-scores")).toBe(false);
  });
});
