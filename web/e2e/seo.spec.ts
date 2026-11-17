import { expect, test } from "@playwright/test";

const SITE = "https://stampboard.derinbay.com";

// Crawlers read the served HTML, so these assert on the raw response, not the hydrated DOM.
test.describe("SEO surfaces", () => {
  for (const locale of ["en", "tr"] as const) {
    test(`/${locale}/ head carries canonical, hreflang, OG, Twitter and JSON-LD`, async ({
      request,
    }) => {
      const res = await request.get(`/${locale}/`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      const head = html.slice(0, html.indexOf("</head>"));
      expect(head).toContain(`<link rel="canonical" href="${SITE}/${locale}/"/>`);
      for (const [lang, href] of [
        ["en", `${SITE}/en/`],
        ["tr", `${SITE}/tr/`],
        ["x-default", `${SITE}/en/`],
      ])
        expect(head).toContain(`<link rel="alternate" hrefLang="${lang}" href="${href}"/>`);
      expect(head).toContain(`<meta property="og:url" content="${SITE}/${locale}/"/>`);
      expect(head).toContain(`<meta property="og:image" content="${SITE}/og/${locale}.png"/>`);
      expect(head).toContain(`<meta name="twitter:card" content="summary_large_image"/>`);
      expect(head).not.toMatch(/name="robots"/);
      const ld = /<script type="application\/ld\+json">(.+?)<\/script>/.exec(html)?.[1];
      const graph = JSON.parse(ld ?? "null")["@graph"];
      expect(graph[0]).toMatchObject({ "@type": "WebPage", inLanguage: locale });
      expect(graph[1]).toMatchObject({
        "@type": "SoftwareApplication",
        softwareVersion: expect.stringMatching(/^\d+\.\d+\.\d+/),
      });
    });
  }

  test("/ is noindex, follow and has no canonical", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/<meta name="robots" content="noindex, follow"\/>/);
    expect(html).not.toMatch(/rel="canonical"/);
  });

  test("crawl files and OG images are served; unknown paths 404", async ({ request }) => {
    for (const path of ["/robots.txt", "/sitemap.xml", "/og/en.png", "/og/tr.png"])
      expect((await request.get(path)).status(), path).toBe(200);
    expect((await request.get("/no-such-page/")).status()).toBe(404);
  });
});
