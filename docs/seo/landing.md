# Stampboard landing: SEO spec

Spec for issue #17 (slice #15), written before the landing build per the company `landing-page`
skill (`references/seo.md`). The `seo-developer` implements the SEO surfaces after the landing
build PR merges and runs the pre-launch audit below. A failed audit blocks launch.

Inputs: [README.md](../../README.md) (product truth), [DESIGN.md](../../DESIGN.md) (the product
page's look) and [package.json](../../package.json). The landing design is option 1, "Monitor
on the Sweep" ([option-1.md](../design/landing/option-1.md)): the Stampboard page on a desktop
monitor, in the slate-blue Labs family. Items once marked _after the design pick_ now follow it.

## 1. Site and pages

The landing is a static export in `web/` (the product itself is a local page, not a signed-in
web app, so there is no `app.` host and no login button).

| Path                                  | Role                                | Indexed | Status |
| ------------------------------------- | ----------------------------------- | ------- | ------ |
| `https://stampboard.derinbay.com/en/` | EN landing, primary and `x-default` | yes     | 200    |
| `https://stampboard.derinbay.com/tr/` | TR landing                          | yes     | 200    |
| `https://stampboard.derinbay.com/`    | Locale chooser (section 4)          | no      | 200    |
| `/robots.txt`, `/sitemap.xml`         | Crawl files                         | n/a     | 200    |
| Any other path                        | `404.html`                          | no      | 404    |

No other indexable pages. Install, configuration and security detail link out to the GitHub
README rather than becoming landing pages.

## 2. Target queries and intent

One primary intent for both pages: a developer who runs GitHub Actions across several
repositories or organisations, often on self-hosted runners, wants one live view of what is
running and queued, and decides whether to install a free local tool.

| Locale | Primary query            | Secondary queries                                                                                                                                                                                                                       |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EN     | github actions dashboard | github actions monitor; github actions queued jobs; self-hosted runner dashboard; github pull request dashboard multiple repositories; github issues across organizations; claude code sessions dashboard; stampboard; github run panel |
| TR     | github actions panosu    | github actions dashboard; github actions izleme; self-hosted runner; açık pull request listesi; stampboard                                                                                                                              |

Evidence is SERP intent from searches on 2026-11-17, not volume data; no volume figure is
claimed.

- **EN:** "github actions dashboard" and its runner/queue variants return monitoring tools
  (a Grafana runner dashboard, Dispatchoor, Live Actions) and GitHub docs noting there is no
  built-in cross-repository queue view. That is the gap Stampboard fills, so it is the primary.
  The pull request queries are secondary: GitHub's own pull requests dashboard at
  `github.com/pulls` went GA in July 2026 and owns that intent.
- **TR:** Turkish-language queries returned only English results, so Turkish volume is low and
  Turkish developers mostly search in English. The primary uses the README's own Turkish term
  ("pano"); the English product terms ("GitHub Actions", "runner", "pull request", "issue")
  stay in the TR copy where the approved copy already uses them. No keyword stuffing beyond the
  approved copy.
- The former name "GitHub Run Panel" is a secondary query and an `alternateName` (section 5) so
  existing users find the renamed project.

Every claim on the page and in the metadata must be backed by the README.

## 3. Titles, descriptions and social tags

Lengths are counted in Unicode characters by script; limits are title ≤ 60 and description ≤ 155.

| Field                                   | EN (`/en/`)                                                                                                                                                | TR (`/tr/`)                                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<title>` (57 / 55)                     | Stampboard: live GitHub Actions dashboard \| Derinbay Labs                                                                                                 | Stampboard: canlı GitHub Actions panosu \| Derinbay Labs                                                                                             |
| `meta description` (154 / 148)          | Open-source GitHub Actions dashboard: running and queued jobs, runners, and open pull requests and issues across your organisations. Runs on your machine. | Açık kaynak GitHub Actions panosu: çalışan ve sıradaki job'lar, runner'lar, organizasyonlarınızdaki açık pull request ve issue'lar. Yerelde çalışır. |
| `og:title`, `twitter:title`             | Same as `<title>` without " \| Derinbay Labs" (the option 1 headline)                                                                                      | Same as `<title>` without " \| Derinbay Labs"                                                                                                        |
| `og:description`, `twitter:description` | Same as meta description                                                                                                                                   | Same as meta description                                                                                                                             |
| `og:url`                                | `https://stampboard.derinbay.com/en/`                                                                                                                      | `https://stampboard.derinbay.com/tr/`                                                                                                                |
| `og:locale` / `og:locale:alternate`     | `en_US` / `tr_TR`                                                                                                                                          | `tr_TR` / `en_US`                                                                                                                                    |
| `og:image`                              | `https://stampboard.derinbay.com/og/en.png`                                                                                                                | `https://stampboard.derinbay.com/og/tr.png`                                                                                                          |
| `og:image:alt`, `twitter:image:alt`     | Stampboard showing running and queued GitHub Actions jobs above open pull requests and issues, with demo data.                                             | Stampboard; çalışan ve sıradaki GitHub Actions job'ları, altında açık pull request ve issue'lar, örnek verilerle.                                    |

Shared on both pages: `og:type` `website`, `og:site_name` `Stampboard`, `og:image:width`
`1200`, `og:image:height` `630`, `og:image:type` `image/png`, `twitter:card`
`summary_large_image`. No `twitter:site` (there is no account). No `meta keywords`.

If the chosen copy changes the product description, the titles and descriptions above are
re-cut to match the copy and re-counted; the primary query stays in both.

## 4. Canonical, hreflang and the root

- Each locale page has a self-referencing absolute canonical with the trailing slash
  (`trailingSlash: true`): `/en/` → `https://stampboard.derinbay.com/en/`, `/tr/` →
  `https://stampboard.derinbay.com/tr/`.
- Both locale pages carry the same reciprocal set:

  ```html
  <link
    rel="alternate"
    hreflang="en"
    href="https://stampboard.derinbay.com/en/"
  />
  <link
    rel="alternate"
    hreflang="tr"
    href="https://stampboard.derinbay.com/tr/"
  />
  <link
    rel="alternate"
    hreflang="x-default"
    href="https://stampboard.derinbay.com/en/"
  />
  ```

- `<html lang>` is `en` on `/en/` and `tr` on `/tr/`. The EN/TR switch links to the other
  locale's canonical URL with `hreflang` and `lang` attributes.
- `/` chooses a locale without cookies: a minimal static page with
  `<meta name="robots" content="noindex, follow">`, no canonical, plain links to `/en/` and
  `/tr/`, and a same-origin script file (CSP `default-src 'self'` blocks inline script) that
  calls `location.replace('/tr/')` when the first entry of `navigator.languages` starts with
  `tr`, otherwise `location.replace('/en/')`. `/` is not in the sitemap.
- Host duplicates: the Firebase default hosts (`stampboard-derinbay.web.app`,
  `stampboard-derinbay.firebaseapp.com`) and the `preview` channel serve the same build as live.
  They cannot carry a different `robots.txt` or header, so the absolute canonical to
  `stampboard.derinbay.com` is the de-duplication signal; preview channel URLs are never
  published.

## 5. Structured data (JSON-LD)

One `<script type="application/ld+json">` per locale page, with an `@graph` of a `WebPage` and a
`SoftwareApplication`. EN shown; the TR page swaps the `WebPage` `@id`/`url`/`name`,
`inLanguage` to `tr`, `image` to `/og/tr.png` and `description` to the TR meta description.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://stampboard.derinbay.com/en/#webpage",
      "url": "https://stampboard.derinbay.com/en/",
      "name": "Stampboard: live GitHub Actions dashboard | Derinbay Labs",
      "inLanguage": "en",
      "about": { "@id": "https://stampboard.derinbay.com/#app" },
      "primaryImageOfPage": "https://stampboard.derinbay.com/og/en.png",
      "publisher": { "@id": "https://derinbay.com/#labs" }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://stampboard.derinbay.com/#app",
      "name": "Stampboard",
      "alternateName": "GitHub Run Panel",
      "description": "<EN meta description>",
      "url": "https://stampboard.derinbay.com/en/",
      "applicationCategory": "DeveloperApplication",
      "applicationSubCategory": "GitHub Actions dashboard",
      "operatingSystem": "Windows, macOS, Linux",
      "softwareRequirements": "Node.js 26 or newer; GitHub CLI (gh), signed in",
      "softwareVersion": "<version from package.json>",
      "license": "https://github.com/derinbay/stampboard/blob/master/LICENSE",
      "isAccessibleForFree": true,
      "installUrl": "https://github.com/derinbay/stampboard#quick-start",
      "sameAs": ["https://github.com/derinbay/stampboard"],
      "image": "https://stampboard.derinbay.com/og/en.png",
      "inLanguage": ["en", "tr"],
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "publisher": {
        "@type": "Organization",
        "@id": "https://derinbay.com/#labs",
        "name": "Derinbay Labs",
        "url": "https://derinbay.com/en/labs/"
      }
    }
  ]
}
```

- `SoftwareApplication`, not `SoftwareSourceCode`: the page sells an installable tool, and Google
  reads only `SoftwareApplication` for software rich results. The source repository is
  `sameAs`.
- `inLanguage` on the app is both locales because the interface is English and Turkish
  (README, "Interface").
- `softwareVersion` is read from the repo-root `package.json` at build time, never typed by hand.
  `installUrl` is the README quick start: the package is `private` and not on npm.
- No `aggregateRating` or `review`: there are none, and inventing them breaks Google's
  structured-data policy. The Rich Results Test therefore reports the `SoftwareApplication` as
  not eligible for a rich result; that is expected and is not an audit failure (section 9).
- No store links: the product is cloned from GitHub, not installed from a store.

## 6. OG image

- Two files, `web/public/og/en.png` and `web/public/og/tr.png`, 1200 × 630 PNG, each ≤ 150 KB.
- Content: a render of the Stampboard page itself (Actions board above the pull request and issue
  ledgers) in the matching interface language (`?lang=en`, `?lang=tr`). The source is
  `npm run demo` data only, never a live account: a render from a signed-in `gh` would publish
  real repository, branch and author names.
- Theme and crop: the light theme, the Actions board above the pull request and issue ledgers.
  Overlay: one card, bottom-left, in the landing's `--cmd-bg` ink with the Stampboard mark and
  wordmark at 30 px and the locale's H1 at 48 px (frame pixels) in Funnel Display 700, with a
  `--cmd-focus` left rule. The Labs nameplate stays out of the image (footer only, as on the other
  Labs landings).
- Text that must be legible (wordmark, any headline) stays inside a 1080 × 510 safe area centred
  in the frame, no smaller than 28 px; board and ledger rows are illustration and exempt.
- Rendered once and committed as static files; no runtime image generation. A
  `web/scripts/render-og.mjs` re-renders both from the demo server.

## 7. Sitemap and robots

`web/public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://stampboard.derinbay.com/sitemap.xml
```

`web/public/sitemap.xml` lists only the two locale pages, each with the full alternate set:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://stampboard.derinbay.com/en/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://stampboard.derinbay.com/en/"/>
    <xhtml:link rel="alternate" hreflang="tr" href="https://stampboard.derinbay.com/tr/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://stampboard.derinbay.com/en/"/>
  </url>
  <url>
    <loc>https://stampboard.derinbay.com/tr/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://stampboard.derinbay.com/en/"/>
    <xhtml:link rel="alternate" hreflang="tr" href="https://stampboard.derinbay.com/tr/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://stampboard.derinbay.com/en/"/>
  </url>
</urlset>
```

No `lastmod`, `changefreq` or `priority`; Google ignores the last two and a build-time `lastmod`
would claim changes that did not happen. `sitemap.xml` is served as `application/xml`.

## 8. Performance budget

Mobile, Lighthouse default throttling, on each locale page:

| Metric                             | Budget                                   |
| ---------------------------------- | ---------------------------------------- |
| LCP                                | ≤ 2.5 s                                  |
| CLS                                | ≤ 0.1                                    |
| TBT                                | ≤ 200 ms                                 |
| JavaScript, first load, compressed | ≤ 150 KB                                 |
| Fonts, total, WOFF2, self-hosted   | ≤ 150 KB, Latin plus Turkish glyphs only |
| Total transfer, first load         | ≤ 500 KB                                 |
| Third-party requests               | 0                                        |

Build requirements that keep the budget:

- The H1 is the LCP element and renders as text without waiting for JavaScript or fonts. A board
  screenshot in the hero is not the LCP element, or it is a preloaded, sized image within budget.
- Every image reserves its size (`width` and `height`); below-the-fold images are lazy-loaded.
- `font-display: swap`; preload at most the one font file used by the H1. The product's
  self-hosted fonts (Archivo, JetBrains Mono, OFL) may be reused if subset to the budget.

## 9. Pre-launch audit

Run against the `preview` channel, then again on live after promotion. Scores go into the launch
PR. Any failure blocks launch.

- [ ] Lighthouse mobile on `/en/` and `/tr/`: SEO 100, accessibility ≥ 95, performance ≥ 90.
- [ ] Core Web Vitals lab data within section 8 on both pages.
- [ ] Schema Markup Validator: 0 errors, 0 warnings on both pages; Rich Results Test: JSON-LD
      parses, no errors (non-eligibility for lack of ratings is expected, section 5).
- [ ] `/en/`, `/tr/`, `/`, `/robots.txt`, `/sitemap.xml` return 200; an unknown path returns 404.
- [ ] Canonical and `hreflang` on both pages match section 4 and are reciprocal; sitemap
      alternates match the page tags.
- [ ] `/` carries `noindex, follow` and sends a `tr` browser to `/tr/` and others to `/en/`; no
      `noindex` on `/en/` or `/tr/` on live.
- [ ] Titles and descriptions match section 3 and fit the limits; one H1 per page.
- [ ] OG and Twitter tags render with the right locale image in a card preview; the image shows
      demo data only.
- [ ] Network log on both pages shows no third-party request and no `Set-Cookie`.
- [ ] Every claim in the metadata and JSON-LD is in the README.
