import { describe, it, expect } from "vitest";
import { escapeHtml, getIsoWeekKey, lpComposite } from "./weeklyReportService";

// ── escapeHtml ────────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
    expect(escapeHtml("Gold IV")).toBe("Gold IV");
    expect(escapeHtml("Positioning")).toBe("Positioning");
  });

  it("escapes ampersand", () => {
    expect(escapeHtml("Kills & Deaths")).toBe("Kills &amp; Deaths");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  it("escapes all hazardous characters in one string", () => {
    const malicious = `<img src="x" onerror='alert(1)' & more>`;
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<");
    expect(escaped).not.toContain(">");
    expect(escaped).not.toContain('"');
    expect(escaped).not.toContain("'");
    expect(escaped).not.toContain("&img"); // & becomes &amp; not left alone
    expect(escaped).toContain("&amp;");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

// ── getIsoWeekKey ─────────────────────────────────────────────────────────────

describe("getIsoWeekKey", () => {
  it("returns W01 for the first week of 2024 (Jan 1 = Monday)", () => {
    // Jan 1, 2024 is Monday — ISO W01 of 2024
    expect(getIsoWeekKey(new Date("2024-01-01T12:00:00Z"))).toBe("2024-W01");
  });

  it("assigns last days of 2025 to W01 of 2026 when they fall in week 1 of the new year", () => {
    // Jan 1, 2026 is Thursday → ISO W01 starts Mon Dec 29, 2025
    // Dec 29–31, 2025 belong to 2026-W01
    expect(getIsoWeekKey(new Date("2025-12-29T12:00:00Z"))).toBe("2026-W01");
    expect(getIsoWeekKey(new Date("2025-12-31T12:00:00Z"))).toBe("2026-W01");
  });

  it("computes a mid-year week correctly (2026-06-01 = Monday = W23)", () => {
    // Jun 1, 2026 is Monday. Pivoting to Thursday: Jun 4.
    // Days from Jan 1 to Jun 4 = 31+28+31+30+31+3 = 154. Week = ceil(155/7) = 23.
    expect(getIsoWeekKey(new Date("2026-06-01T09:00:00Z"))).toBe("2026-W23");
  });

  it("is stable across different times on the same day", () => {
    const morning = getIsoWeekKey(new Date("2026-06-01T00:00:00Z"));
    const evening = getIsoWeekKey(new Date("2026-06-01T23:59:59Z"));
    expect(morning).toBe(evening);
  });

  it("produces different keys for different weeks", () => {
    const w22 = getIsoWeekKey(new Date("2026-05-25T12:00:00Z")); // Monday W22
    const w23 = getIsoWeekKey(new Date("2026-06-01T12:00:00Z")); // Monday W23
    expect(w22).not.toBe(w23);
    expect(w22).toBe("2026-W22");
    expect(w23).toBe("2026-W23");
  });
});

// ── lpComposite ───────────────────────────────────────────────────────────────

describe("lpComposite", () => {
  it("produces strictly ascending values across tiers and divisions", () => {
    const iron4 = lpComposite("IRON", "IV", 0);
    const iron3 = lpComposite("IRON", "III", 0);
    const iron1 = lpComposite("IRON", "I", 99);
    const bronze4 = lpComposite("BRONZE", "IV", 0);
    const diamond1 = lpComposite("DIAMOND", "I", 99);
    const master = lpComposite("MASTER", "I", 0);

    expect(iron4).toBeLessThan(iron3);
    expect(iron3).toBeLessThan(iron1);
    expect(iron1).toBeLessThan(bronze4);
    expect(diamond1).toBeLessThan(master);
  });

  it("computes LP change correctly across a promotion", () => {
    // Silver II 80 LP → Silver I 20 LP = +40 LP net
    const before = lpComposite("SILVER", "II", 80);
    const after = lpComposite("SILVER", "I", 20);
    expect(after - before).toBe(40);
  });

  it("handles unknown tier/division gracefully by returning 0 index", () => {
    const result = lpComposite("UNKNOWN", "X", 50);
    expect(result).toBe(50); // 0*400 + 0*100 + 50
  });

  it("reflects an LP loss correctly", () => {
    const before = lpComposite("GOLD", "II", 60);
    const after = lpComposite("GOLD", "II", 40);
    expect(after - before).toBe(-20);
  });
});
