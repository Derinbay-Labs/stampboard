import type { Metadata } from "next";
import { copyFor } from "@/content";
import { SITE_URL, type Locale } from "./locale";

/** Basic per-locale metadata only; canonical, hreflang, OG and JSON-LD are added by the SEO pass. */
export function metadataFor(locale: Locale): Metadata {
  const t = copyFor(locale);
  return { title: t.title, description: t.description };
}

export const rootMetadata: Metadata = { metadataBase: new URL(SITE_URL) };
