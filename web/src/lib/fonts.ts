import { preload } from "react-dom";

const FILES = [
  "funnel-display-%-wght-normal",
  "funnel-sans-%-wght-normal",
  "archivo-%",
  "jbmono-%",
];

/**
 * Preloads the fonts the first paint needs. The faces use `font-display: optional`, so a font
 * that is not ready by first paint is skipped rather than swapped in, which would shift the
 * layout. Turkish needs the latin-ext faces too (ğ, ş, ı, İ).
 */
export function preloadFonts(locale: string): void {
  const subsets = locale === "tr" ? ["latin", "latin-ext"] : ["latin"];
  for (const file of FILES)
    for (const subset of subsets)
      preload(`/fonts/${file.replace("%", subset)}.woff2`, {
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      });
}
