import { describe, expect, it } from "vitest";
import { chooseNextLesson } from "./recommendation";
import { allLessons, getTrack, lessonId, roleTracks } from "./curriculum";
import { DEFAULT_PLACEMENT, type Placement } from "./placement";
import type { LessonStatus } from "./types";

const CORE: Placement = {
  level: "core",
  recommendedTrackId: "laning",
  gamesAnalyzed: 20,
  signals: [],
  leaks: [],
};

function statuses(entries: [string, LessonStatus][] = []): Map<string, LessonStatus> {
  return new Map(entries);
}

/** Marks every lesson finished except the ones named. */
function allDoneExcept(...keep: string[]): Map<string, LessonStatus> {
  return new Map(
    allLessons()
      .map(lessonId)
      .filter((id) => !keep.includes(id))
      .map((id) => [id, "completed" as LessonStatus])
  );
}

describe("chooseNextLesson", () => {
  it("resumes an unfinished lesson before anything else", () => {
    const target = getTrack("laning")!.lessons[3];
    const result = chooseNextLesson({
      statuses: statuses([[lessonId(target), "in_progress"]]),
      placement: DEFAULT_PLACEMENT,
      detectedLeaks: ["low_vision"],
    });

    expect(result?.lesson).toBe(target);
    expect(result?.source).toBe("resume");
  });

  // A mastery the decay check took back outranks a leak: the player has already proved they
  // can hold this habit, and their own games say it stopped.
  it("puts a decayed lesson ahead of a detected leak", () => {
    const target = getTrack("laning")!.lessons[1];
    const result = chooseNextLesson({
      statuses: statuses([[lessonId(target), "review"]]),
      placement: CORE,
      detectedLeaks: ["low_vision"],
    });

    expect(result?.lesson).toBe(target);
    expect(result?.source).toBe("review");
    expect(result?.reason).toMatch(/gone back/);
  });

  it("still resumes an open lesson before a decayed one", () => {
    const open = getTrack("laning")!.lessons[3];
    const decayed = getTrack("laning")!.lessons[1];
    const result = chooseNextLesson({
      statuses: statuses([
        [lessonId(open), "in_progress"],
        [lessonId(decayed), "review"],
      ]),
      placement: CORE,
      detectedLeaks: [],
    });

    expect(result?.source).toBe("resume");
  });

  it("sends a confirmed leak to a lesson that fixes it", () => {
    const result = chooseNextLesson({
      statuses: statuses(),
      placement: CORE,
      detectedLeaks: ["low_vision"],
    });

    expect(result?.source).toBe("leak");
    expect(result?.lesson.fixes).toContain("low_vision");
    expect(result?.reason).toContain("vision");
  });

  // A confirmed habit comes from weeks of data; a placement leak is one 20-game snapshot.
  it("prefers a confirmed leak over a placement leak", () => {
    const result = chooseNextLesson({
      statuses: statuses(),
      placement: { ...CORE, leaks: ["low_cs"] },
      detectedLeaks: ["low_vision"],
    });

    expect(result?.lesson.fixes).toContain("low_vision");
  });

  it("falls through to a placement leak when there is no confirmed one", () => {
    const result = chooseNextLesson({
      statuses: statuses(),
      placement: { ...CORE, leaks: ["low_vision"] },
      detectedLeaks: [],
    });

    expect(result?.source).toBe("leak");
    expect(result?.lesson.fixes).toContain("low_vision");
  });

  it("skips a leak whose lessons are all finished", () => {
    const visionLessons = allLessons().filter((l) => l.fixes.includes("low_vision"));
    const result = chooseNextLesson({
      statuses: statuses(visionLessons.map((l) => [lessonId(l), "completed" as LessonStatus])),
      placement: CORE,
      detectedLeaks: ["low_vision"],
    });

    expect(result?.source).toBe("placement");
    expect(result?.lesson.trackId).toBe("laning");
  });

  it("otherwise opens the track placement chose", () => {
    const result = chooseNextLesson({
      statuses: statuses(),
      placement: CORE,
      detectedLeaks: [],
    });

    expect(result?.source).toBe("placement");
    expect(result?.lesson).toBe(getTrack("laning")!.lessons[0]);
    expect(result?.reason).toContain("20 games");
  });

  it("does not cite a game count it does not have", () => {
    const result = chooseNextLesson({
      statuses: statuses(),
      placement: DEFAULT_PLACEMENT,
      detectedLeaks: [],
    });

    expect(result?.reason).not.toContain("0 games");
  });

  it("reaches outside the placed track once that track is finished", () => {
    const laning = getTrack("laning")!;
    const survivor = getTrack("foundations")!.lessons[2];
    const done = new Map(
      laning.lessons.map((l) => [lessonId(l), "completed" as LessonStatus])
    );

    const result = chooseNextLesson({
      statuses: done,
      placement: CORE,
      detectedLeaks: [],
    });

    expect(result?.source).toBe("next");
    expect(result?.lesson.trackId).toBe("foundations");
    expect(allLessons()).toContain(survivor);
  });

  it("returns null when the whole curriculum is finished", () => {
    expect(
      chooseNextLesson({
        statuses: allDoneExcept(),
        placement: CORE,
        detectedLeaks: ["low_cs"],
      })
    ).toBeNull();
  });

  // A role path is a supplement for one role. Offering a jungle lesson to a support main is
  // worse than offering nothing, so the Academy only ever picks the reader's own (ADR-028).
  it("never offers a role path belonging to somebody else's role", () => {
    const path = roleTracks()[0];
    const target = path.lessons[0];
    const other = roleTracks().find((t) => t.role !== path.role);

    const result = chooseNextLesson({
      statuses: allDoneExcept(lessonId(target)),
      placement: CORE,
      detectedLeaks: [],
      role: other ? other.role : null,
    });

    expect(result).toBeNull();
  });

  it("offers a role path to the role it is about", () => {
    const path = roleTracks()[0];
    const target = path.lessons[0];

    const result = chooseNextLesson({
      statuses: allDoneExcept(lessonId(target)),
      placement: CORE,
      detectedLeaks: [],
      role: path.role,
    });

    expect(result?.lesson).toBe(target);
  });

  it("offers no role path at all when the player's role is unknown", () => {
    const target = roleTracks()[0].lessons[0];

    expect(
      chooseNextLesson({
        statuses: allDoneExcept(lessonId(target)),
        placement: CORE,
        detectedLeaks: [],
        role: null,
      })
    ).toBeNull();
  });

  // Exempt on purpose: this is a lesson the player opened themselves, and a main role that has
  // drifted since should not strand it half-finished.
  it("still resumes a role path the player already opened, whatever their role reads as now", () => {
    const target = roleTracks()[0].lessons[1];

    const result = chooseNextLesson({
      statuses: statuses([[lessonId(target), "in_progress"]]),
      placement: CORE,
      detectedLeaks: [],
      role: null,
    });

    expect(result?.lesson).toBe(target);
    expect(result?.source).toBe("resume");
  });

  it("counts a mastered lesson as finished", () => {
    const first = getTrack("laning")!.lessons[0];
    const result = chooseNextLesson({
      statuses: statuses([[lessonId(first), "mastered"]]),
      placement: CORE,
      detectedLeaks: [],
    });

    expect(result?.lesson).not.toBe(first);
  });
});
