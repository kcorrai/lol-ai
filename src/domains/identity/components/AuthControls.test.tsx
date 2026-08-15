import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField, PasswordMeter, scorePassword } from "./AuthControls";

describe("scorePassword", () => {
  it("scores length, mixed case, digits and symbols independently", () => {
    expect(scorePassword("")).toBe(0);
    expect(scorePassword("abcdefgh")).toBe(34);
    expect(scorePassword("Abcdefgh")).toBe(56);
    expect(scorePassword("Abcdefg1")).toBe(78);
    expect(scorePassword("Abcdefg1!")).toBe(100);
  });

  it("does not let a long lowercase string read as strong", () => {
    expect(scorePassword("correcthorsebatterystaple")).toBe(34);
  });
});

describe("PasswordMeter", () => {
  it("labels the band the score falls in", () => {
    const { rerender } = render(<PasswordMeter password="" />);
    expect(screen.getByText("—")).toBeInTheDocument();

    rerender(<PasswordMeter password="abcdefgh" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();

    rerender(<PasswordMeter password="Abcdefgh" />);
    expect(screen.getByText("OK")).toBeInTheDocument();

    rerender(<PasswordMeter password="Abcdefg1!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });
});

describe("PasswordField", () => {
  it("flips the input between password and text", async () => {
    const user = userEvent.setup();
    render(<PasswordField id="password" label="Password" />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
