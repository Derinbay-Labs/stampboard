import type { Metadata } from "next";
import {
  CloseUps,
  Final,
  Footer,
  Hero,
  Nav,
  Spec,
  StageSection,
  Steps,
  Trust,
} from "@/components/Sections";
import { copyFor } from "@/content";
import { localeFrom } from "@/lib/locale";
import { metadataFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return metadataFor(await localeFrom(params));
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeFrom(params);
  const t = copyFor(locale);
  return (
    <>
      <Nav t={t} locale={locale} />
      <main id="main">
        <Hero t={t} />
        <StageSection t={t} locale={locale} />
        <Spec t={t} />
        <CloseUps t={t} locale={locale} />
        <Steps t={t} />
        <Trust t={t} />
        <Final t={t} locale={locale} />
      </main>
      <Footer t={t} locale={locale} />
    </>
  );
}
