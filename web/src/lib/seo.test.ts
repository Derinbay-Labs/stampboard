import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copyFor } from "@/content";
import { LOCALES } from "./locale";
import { alternates, jsonLdFor, jsonLdScript, metadataFor, productVersion } from "./seo";

const SITE = "https://stampboard.derinbay.com";
const PUBLIC = join(process.cwd(), "public");

describe("metadataFor", () => {
  for (const locale of LOCALES) {
    it(`${locale}: canonical, hreflang, OG and Twitter per the spec`, () => {
      const m = metadataFor(locale);
      expect(m.alternates?.canonical).toBe(`${SITE}/${locale}/`);
      expect(m.alternates?.languages).toEqual({
        en: `${SITE}/en/`,
        tr: `${SITE}/tr/`,
        "x-default": `${SITE}/en/`,
      });
      expect(m.openGraph).toMatchObject({
        url: `${SITE}/${locale}/`,
        locale: locale === "tr" ? "tr_TR" : "en_US",
        alternateLocale: [locale === "tr" ? "en_US" : "tr_TR"],
        images: [{ url: `${SITE}/og/${locale}.png`, width: 1200, height: 630 }],
      });
      expect(m.twitter).toMatchObject({ card: "summary_large_image" });
      expect(m.title).toBe(copyFor(locale).title);
    });
  }
});

describe("jsonLdFor", () => {
  it("keeps the app identity and swaps the page per locale", () => {
    const [enPage, enApp] = jsonLdFor("en", "1.2.3")["@graph"];
    const [trPage, trApp] = jsonLdFor("tr", "1.2.3")["@graph"];
    expect(enPage?.["@id"]).toBe(`${SITE}/en/#webpage`);
    expect(trPage?.["@id"]).toBe(`${SITE}/tr/#webpage`);
    expect(trPage?.inLanguage).toBe("tr");
    expect(trApp?.["@id"]).toBe(enApp?.["@id"]);
    expect(trApp?.url).toBe(`${SITE}/en/`);
    expect(trApp?.description).toBe(copyFor("tr").description);
    expect(trApp?.image).toBe(`${SITE}/og/tr.png`);
    expect(enApp).toMatchObject({
      "@type": "SoftwareApplication",
      softwareVersion: "1.2.3",
      publisher: { "@type": "Organization", "@id": "https://derinbay.com/#labs" },
    });
    expect(enApp).not.toHaveProperty("aggregateRating");
  });
  it("reads the version from the repo-root package.json", () => {
    expect(productVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
  it("escapes < so the script cannot be closed early", () => {
    expect(jsonLdScript({ a: "</script>" })).not.toContain("<");
  });
});

describe("crawl files", () => {
  it("sitemap lists each locale page with the same alternates as the page tags", () => {
    const xml = readFileSync(join(PUBLIC, "sitemap.xml"), "utf8");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(LOCALES.map((l) => `${SITE}/${l}/`));
    for (const [lang, href] of Object.entries(alternates()))
      expect(xml.split(`hreflang="${lang}" href="${href}"`)).toHaveLength(LOCALES.length + 1);
    expect(xml).not.toMatch(/lastmod|changefreq|priority/);
  });
  it("robots allows all and points at the sitemap", () => {
    const robots = readFileSync(join(PUBLIC, "robots.txt"), "utf8");
    expect(robots).toMatch(/^User-agent: \*\nAllow: \/\n/);
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });
  for (const locale of LOCALES) {
    it(`og/${locale}.png is a 1200x630 PNG within 150 KB`, () => {
      const file = join(PUBLIC, "og", `${locale}.png`);
      const head = readFileSync(file).subarray(0, 24);
      expect(head.subarray(1, 4).toString("latin1")).toBe("PNG");
      expect([head.readUInt32BE(16), head.readUInt32BE(20)]).toEqual([1200, 630]);
      expect(statSync(file).size).toBeLessThanOrEqual(150 * 1024);
    });
  }
});
