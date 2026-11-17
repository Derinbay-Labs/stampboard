import { REPO_URL } from "@/content";
import { productFor } from "@/content/product";
import type { Copy, Lang } from "@/content/types";
import { inlineCode } from "@/lib/inline";
import { LOCALES, labsUrl, pathFor } from "@/lib/locale";
import { CLOSE_AGENTS, CLOSE_PRS, MORNING as CLOSE_PEEK, PLATE_RUNNERS } from "@/lib/sample";
import { CommandBlock } from "./CommandBlock";
import { Icon, LabsMark, Logo } from "./icons";
import { AgentsSheet, Plate, PrLedger, SbApp } from "./Product";
import { Stage } from "./Stage";

const GithubLink = () => (
  <a className="btn btn-quiet btn-gh" href={REPO_URL}>
    <Icon name="github" />
    <span>GitHub</span>
  </a>
);

const Mark = () => (
  <a className="mark" href="#top">
    <Logo />
    <span>Stampboard</span>
  </a>
);

export function Nav({ t, locale }: { t: Copy; locale: Lang }) {
  return (
    <header className="wrap nav" id="top">
      <Mark />
      <nav aria-label={t.mainNav}>
        <ul>
          <li>
            <a href="#board">{t.navBoard}</a>
          </li>
          <li>
            <a href="#install">{t.navInstall}</a>
          </li>
          <li>
            <a href="#trust">{t.navTrust}</a>
          </li>
        </ul>
      </nav>
      <div className="nav-end">
        <div className="seg" role="group" aria-label={t.langLabel}>
          {LOCALES.map((l) => (
            <a
              key={l}
              href={pathFor(l)}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
            >
              {l.toUpperCase()}
            </a>
          ))}
        </div>
        <GithubLink />
      </div>
    </header>
  );
}

export function Hero({ t }: { t: Copy }) {
  return (
    <section className="wrap hero">
      <h1>{t.h1}</h1>
      <div>
        <p className="lead">{t.lead}</p>
        <CommandBlock labels={t} />
        <p className="cmd-note">{inlineCode(t.cmdNote)}</p>
      </div>
    </section>
  );
}

export function StageSection({ t, locale }: { t: Copy; locale: Lang }) {
  return <Stage t={t} locale={locale} />;
}

export function Spec({ t }: { t: Copy }) {
  return (
    <div className="wrap">
      <dl className="spec">
        <div>
          <dt>{t.p1t}</dt>
          <dd className="fig">0</dd>
        </div>
        <div>
          <dt>{t.p2t}</dt>
          <dd className="fig">{t.p2v}</dd>
        </div>
        <div>
          <dt>{t.p3t}</dt>
          <dd className="fig">127.0.0.1</dd>
        </div>
        <div>
          <dt>{t.p4t}</dt>
          <dd className="fig">MIT</dd>
        </div>
      </dl>
    </div>
  );
}

export function CloseUps({ t, locale }: { t: Copy; locale: Lang }) {
  const v = { t: productFor(locale), lang: locale };
  return (
    <section className="wrap sec" aria-labelledby="f-h">
      <h2 className="sec-h" id="f-h">
        {t.fH}
      </h2>
      <div className="close">
        <article className="plinth">
          <div>
            <h3>{t.c1h}</h3>
            <p>{t.c1p}</p>
          </div>
          <div className="sb sb-paper">
            <div className="sb-app" style={{ padding: 14 }}>
              <PrLedger prs={CLOSE_PRS.prs} v={v} />
            </div>
          </div>
        </article>
        <article className="plinth">
          <div>
            <h3>{t.c2h}</h3>
            <p>{t.c2p}</p>
          </div>
          <div className="sb">
            <div className="plates">
              {PLATE_RUNNERS.map((r) => (
                <Plate key={r} name={r} />
              ))}
              <Plate name="" hosted />
            </div>
          </div>
        </article>
        <article className="plinth">
          <div>
            <h3>{t.c3h}</h3>
            <p>{t.c3p}</p>
          </div>
          <div className="sb sb-paper">
            <div className="sb-app" style={{ padding: 14 }}>
              <AgentsSheet
                sessions={CLOSE_AGENTS.sessions}
                down={CLOSE_AGENTS.downHosts}
                v={v}
              />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function Steps({ t }: { t: Copy }) {
  const steps = [
    { h: t.s1h, p: t.s1p, code: `git clone ${REPO_URL}.git\ncd stampboard` },
    {
      h: t.s2h,
      p: t.s2p,
      code: "npm start      # localhost:4747\nnpm run demo   # sample data",
    },
    { h: t.s3h, p: t.s3p, code: "npm run install-service" },
  ];
  return (
    <section className="wrap sec" id="install" aria-labelledby="i-h">
      <h2 className="sec-h" id="i-h">
        {t.iH}
      </h2>
      <ol className="steps">
        {steps.map((s) => (
          <li key={s.h}>
            <h3>{s.h}</h3>
            <p>{s.p}</p>
            <code>{s.code}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Trust({ t }: { t: Copy }) {
  const rows = [
    [t.t1h, t.t1p],
    [t.t2h, t.t2p],
    [t.t3h, t.t3p],
    [t.t4h, t.t4p],
    [t.t5h, t.t5p],
  ] as const;
  return (
    <section className="wrap sec" id="trust" aria-labelledby="t-h">
      <h2 className="sec-h" id="t-h">
        {t.tH}
      </h2>
      <dl className="trust">
        {rows.map(([h, p]) => (
          <div key={h}>
            <dt>{h}</dt>
            <dd>{inlineCode(p)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Final({ t, locale }: { t: Copy; locale: Lang }) {
  const v = { t: productFor(locale), lang: locale };
  return (
    <section className="final" aria-labelledby="final-h">
      <div className="wrap final-grid">
        <div className="final-copy">
          <h2 id="final-h">{t.finalH}</h2>
          <CommandBlock labels={t} />
          <div className="hero-actions">
            <GithubLink />
          </div>
        </div>
        <div className="peek" aria-hidden="true">
          <div className="sb sb-paper">
            <SbApp scene={CLOSE_PEEK} v={v} foot={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ t, locale }: { t: Copy; locale: Lang }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Mark />
            <p>{t.footTag}</p>
          </div>
          <nav aria-label={t.footNav}>
            <ul>
              <li>
                <a href={REPO_URL}>GitHub</a>
              </li>
              <li>
                <a href={`${REPO_URL}#readme`}>README</a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/master/LICENSE`}>{t.footLicense}</a>
              </li>
            </ul>
          </nav>
          <a className="labs" href={labsUrl(locale)} hrefLang={locale}>
            <span className="labs-mark">
              <LabsMark />
            </span>
            <span className="labs-text">
              <span>{t.labs}</span>
              <small>{t.labsSmall}</small>
            </span>
          </a>
        </div>
        <div className="foot-bottom">
          <span>{t.legal}</span>
          <span>{t.sample}</span>
        </div>
      </div>
    </footer>
  );
}
