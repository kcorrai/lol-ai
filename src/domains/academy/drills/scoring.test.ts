import { describe, expect, it } from "vitest";
import { gradeDrill, scoreLesson, PASS_RATIO } from "./scoring";
import type { OrderDrill, QuizDrill } from "@/domains/academy/types";

const quiz: QuizDrill = {
  id: "q1",
  kind: "quiz",
  prompt: "Which is it?",
  options: [
    { id: "a", label: "Right", explain: "Because A.", correct: true },
    { id: "b", label: "Wrong", explain: "Because not B.", correct: false },
  ],
};

const order: OrderDrill = {
  id: "o1",
  kind: "order",
  prompt: "Sort them",
  items: [
    { id: "x", label: "First" },
    { id: "y", label: "Second" },
  ],
  correctOrder: ["x", "y"],
  explain: "X then Y.",
};

describe("gradeDrill", () => {
  it("marks the correct choice and returns that option's explanation", () => {
    expect(gradeDrill(quiz, ["a"])).toEqual({
      drillId: "q1",
      correct: true,
      explanation: "Because A.",
    });
  });

  // A wrong answer has to teach, so the explanation comes from the option the player picked,
  // not from the correct one.
  it("returns the picked option's explanation when wrong", () => {
    expect(gradeDrill(quiz, ["b"])).toEqual({
      drillId: "q1",
      correct: false,
      explanation: "Because not B.",
    });
  });

  it("treats an unknown or empty answer as wrong", () => {
    expect(gradeDrill(quiz, []).correct).toBe(false);
    expect(gradeDrill(quiz, ["zzz"]).correct).toBe(false);
  });

  it("treats a multi-id answer to a choice drill as unanswered", () => {
    expect(gradeDrill(quiz, ["a", "b"]).correct).toBe(false);
  });

  it("grades an order drill only on the exact sequence", () => {
    expect(gradeDrill(order, ["x", "y"]).correct).toBe(true);
    expect(gradeDrill(order, ["y", "x"]).correct).toBe(false);
    expect(gradeDrill(order, ["x"]).correct).toBe(false);
  });

  it("explains an order drill the same way whether right or wrong", () => {
    expect(gradeDrill(order, ["y", "x"]).explanation).toBe("X then Y.");
  });
});

describe("scoreLesson", () => {
  it("scores every drill in the lesson, including unanswered ones", () => {
    const result = scoreLesson([quiz, order], [{ drillId: "q1", answer: ["a"] }]);

    expect(result.total).toBe(2);
    expect(result.correct).toBe(1);
    expect(result.score).toBe(50);
    expect(result.results).toHaveLength(2);
  });

  it("passes at the pass ratio and fails below it", () => {
    const allRight = scoreLesson([quiz, order], [
      { drillId: "q1", answer: ["a"] },
      { drillId: "o1", answer: ["x", "y"] },
    ]);
    expect(allRight.score).toBe(100);
    expect(allRight.passed).toBe(true);

    const half = scoreLesson([quiz, order], [{ drillId: "q1", answer: ["a"] }]);
    expect(half.passed).toBe(0.5 >= PASS_RATIO);
    expect(half.passed).toBe(false);
  });

  it("treats a lesson with no drills as passed at 100", () => {
    const result = scoreLesson([], []);
    expect(result).toMatchObject({ total: 0, score: 100, passed: true });
  });

  it("ignores attempts for drills the lesson does not contain", () => {
    const result = scoreLesson([quiz], [
      { drillId: "q1", answer: ["a"] },
      { drillId: "ghost", answer: ["a"] },
    ]);
    expect(result.total).toBe(1);
    expect(result.score).toBe(100);
  });
});
