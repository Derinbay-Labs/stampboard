import type { Metadata } from "next";
import type { ReactNode } from "react";
import { rootMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  ...rootMetadata,
  title: "Stampboard",
  description: "A live GitHub Actions dashboard. Canlı bir GitHub Actions panosu.",
  // The locale chooser is not indexed.
  robots: { index: false, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
