import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { copyFor, REPO_URL } from "@/content";
import { LOCALES, SITE_URL, otherLocale, pathFor, type Locale } from "./locale";

// SEO surfaces of the landing, per docs/seo/landing.md. Every URL is absolute on the canonical
// host so the Firebase default hosts and preview channels de-duplicate to it.

const OG_LOCALE: Record<Locale, string> = { en: "en_US", tr: "tr_TR" };

const OG_ALT: Record<Locale, string> = {
  en: "Stampboard showing running and queued GitHub Actions jobs above open pull requests and issues, with demo data.",
  tr: "Stampboard; çalışan ve sıradaki GitHub Actions job'ları, altında açık pull request ve issue'lar, örnek verilerle.",
};

export const LABS_ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://derinbay.com/#labs",
  name: "Derinbay Labs",
  url: "https://derinbay.com/en/labs/",
} as const;

export function canonicalFor(locale: Locale): string {
  return `${SITE_URL}${pathFor(locale)}`;
}

export function ogImageFor(locale: Locale): string {
  return `${SITE_URL}/og/${locale}.png`;
}

/** hreflang map shared by both locale pages and the sitemap; EN is the x-default. */
export function alternates(): Record<Locale | "x-default", string> {
  const map = Object.fromEntries(LOCALES.map((l) => [l, canonicalFor(l)])) as Record<
    Locale,
    string
  >;
  return { ...map, "x-default": canonicalFor("en") };
}

/** The product version, read from the repo-root package.json at build time. */
export function productVersion(): string {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "..", "package.json"), "utf8")) as {
    version?: unknown;
  };
  if (typeof pkg.version !== "string" || !pkg.version)
    throw new Error("no version in the repo-root package.json");
  return pkg.version;
}

export function metadataFor(locale: Locale): Metadata {
  const t = copyFor(locale);
  const image = {
    url: ogImageFor(locale),
    width: 1200,
    height: 630,
    type: "image/png",
    alt: OG_ALT[locale],
  };
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: canonicalFor(locale), languages: alternates() },
    // Social title is the chosen headline (spec section 3, after the design pick).
    openGraph: {
      type: "website",
      siteName: "Stampboard",
      title: t.h1,
      description: t.description,
      url: canonicalFor(locale),
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[otherLocale(locale)]],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: t.h1,
      description: t.description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

/**
 * JSON-LD `@graph` of the page and the app (spec section 5). The TR page swaps the WebPage
 * id/url/name/inLanguage and the app's image and description; the app id, url and languages
 * stay the same on both pages.
 */
export function jsonLdFor(locale: Locale, version: string = productVersion()) {
  const t = copyFor(locale);
  const appId = `${SITE_URL}/#app`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalFor(locale)}#webpage`,
        url: canonicalFor(locale),
        name: t.title,
        inLanguage: locale,
        about: { "@id": appId },
        primaryImageOfPage: ogImageFor(locale),
        publisher: { "@id": LABS_ORGANIZATION["@id"] },
      },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: "Stampboard",
        alternateName: "GitHub Run Panel",
        description: t.description,
        url: canonicalFor("en"),
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "GitHub Actions dashboard",
        operatingSystem: "Windows, macOS, Linux",
        softwareRequirements: "Node.js 26 or newer; GitHub CLI (gh), signed in",
        softwareVersion: version,
        license: `${REPO_URL}/blob/master/LICENSE`,
        isAccessibleForFree: true,
        installUrl: `${REPO_URL}#quick-start`,
        sameAs: [REPO_URL],
        image: ogImageFor(locale),
        inLanguage: [...LOCALES],
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: LABS_ORGANIZATION,
      },
    ],
  };
}

/** Serialises JSON-LD for an inline script; `<` is escaped so no `</script>` can close it. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const rootMetadata: Metadata = { metadataBase: new URL(SITE_URL) };
