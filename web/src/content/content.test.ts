import { describe, expect, it } from "vitest";
import { copyFor } from ".";
import { productFor } from "./product";
import type { Lang } from "./types";

const LANGS: Lang[] = ["en", "tr"];

describe("copy", () => {
  it("has the same keys in EN and TR, all non-empty", () => {
    expect(Object.keys(copyFor("en")).sort()).toEqual(Object.keys(copyFor("tr")).sort());
    for (const l of LANGS)
      for (const [k, v] of Object.entries(copyFor(l)))
        expect(String(v).trim(), `${l}.${k}`).not.toBe("");
  });
  it("keeps titles and descriptions SERP-sized", () => {
    for (const l of LANGS) {
      expect(copyFor(l).title.length).toBeLessThanOrEqual(60);
      expect(copyFor(l).description.length).toBeLessThanOrEqual(155);
    }
  });
  it("has the same product-screen keys in EN and TR", () => {
    expect(Object.keys(productFor("en")).sort()).toEqual(Object.keys(productFor("tr")).sort());
  });
});
