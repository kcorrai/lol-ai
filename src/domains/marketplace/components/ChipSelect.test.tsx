import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChipSelect } from "@/domains/marketplace/components/ChipSelect";

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "de", label: "Deutsch" },
];

/** A host that owns the state exactly the way the real forms do. */
function Host({ max, initial = [] }: { max?: number; initial?: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  return (
    <>
      <ChipSelect
        aria-label="Languages"
        options={OPTIONS}
        selected={selected}
        onChange={setSelected}
        max={max}
      />
      <output data-testid="value">{selected.join(",")}</output>
    </>
  );
}

const value = () => screen.getByTestId("value").textContent;
const chip = (label: string) => screen.getByRole("checkbox", { name: label });

describe("ChipSelect", () => {
  it("selects and deselects", () => {
    render(<Host />);

    fireEvent.click(chip("English"));
    expect(value()).toBe("en");
    expect(chip("English")).toHaveAttribute("aria-checked", "true");

    fireEvent.click(chip("English"));
    expect(value()).toBe("");
    expect(chip("English")).toHaveAttribute("aria-checked", "false");
  });

  /**
   * The bug this component was rewritten for. Computing the next array from the
   * `selected` prop meant two toggles inside one React batch both read the same
   * render's value, so the second overwrote the first — two chips clicked
   * quickly silently kept only one.
   */
  it("keeps both when two chips are toggled inside one batch", () => {
    render(<Host />);

    act(() => {
      chip("English").click();
      chip("Türkçe").click();
    });

    expect(value()).toBe("en,tr");
  });

  it("keeps the rest when a deselect and a select land in the same batch", () => {
    render(<Host initial={["en"]} />);

    act(() => {
      chip("English").click();
      chip("Deutsch").click();
    });

    expect(value()).toBe("de");
  });

  it("stops accepting new selections at the ceiling", () => {
    render(<Host max={2} />);

    fireEvent.click(chip("English"));
    fireEvent.click(chip("Türkçe"));
    fireEvent.click(chip("Deutsch"));

    expect(value()).toBe("en,tr");
  });

  it("holds the ceiling even when the clicks land in one batch", () => {
    render(<Host max={2} />);

    act(() => {
      chip("English").click();
      chip("Türkçe").click();
      chip("Deutsch").click();
    });

    expect(value()).toBe("en,tr");
  });

  // Otherwise a full set is a trap: the only way out would be a page reload.
  it("still lets a selected chip be removed at the ceiling", () => {
    render(<Host max={2} initial={["en", "tr"]} />);

    expect(chip("Deutsch")).toBeDisabled();
    expect(chip("English")).not.toBeDisabled();

    fireEvent.click(chip("English"));
    expect(value()).toBe("tr");
    expect(chip("Deutsch")).not.toBeDisabled();
  });

  it("ignores every click when disabled", () => {
    function DisabledHost() {
      const [selected, setSelected] = useState<string[]>([]);
      return (
        <>
          <ChipSelect
            aria-label="Languages"
            options={OPTIONS}
            selected={selected}
            onChange={setSelected}
            disabled
          />
          <output data-testid="value">{selected.join(",")}</output>
        </>
      );
    }

    render(<DisabledHost />);
    fireEvent.click(chip("English"));

    expect(value()).toBe("");
  });
});
