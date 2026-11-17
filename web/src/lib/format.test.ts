import { describe, expect, it } from "vitest";
import { age, clock, hhmmss, hue } from "./format";

const U = ["m", "h", "d"] as const;

describe("format", () => {
  it("clock renders mm:ss and rolls into hours", () => {
    expect(clock(240)).toBe("04:00");
    expect(clock(3661)).toBe("1:01:01");
    expect(clock(-5)).toBe("00:00");
  });
  it("hue is stable and within the wheel", () => {
    expect(hue("mac-mini")).toBe(hue("mac-mini"));
    expect(hue("build-box")).toBeGreaterThanOrEqual(0);
    expect(hue("build-box")).toBeLessThan(360);
  });
  it("hhmmss splits main and seconds", () => {
    expect(hhmmss(new Date(2026, 0, 1, 8, 7, 9))).toEqual({ main: "08:07", sec: ":09" });
  });
  it("age picks a unit", () => {
    expect(age(12, U)).toBe("12 m");
    expect(age(300, U)).toBe("5 h");
    expect(age(3000, U)).toBe("2 d");
  });
});
