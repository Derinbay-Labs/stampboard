"use client";

import { useState, type KeyboardEvent } from "react";
import type { Copy, Lang } from "@/content/types";
import { productFor } from "@/content/product";
import { SCENES, SCENE_IDS, type SceneId } from "@/lib/sample";
import { SbApp, type Part } from "./Product";

const SCENE_LABEL: Record<SceneId, "sc1" | "sc2" | "sc3"> = {
  morning: "sc1",
  quiet: "sc2",
  hosts: "sc3",
};
const NOTES: { part: Part; h: "n1h" | "n2h" | "n3h"; p: "n1p" | "n2p" | "n3p" }[] = [
  { part: "board", h: "n1h", p: "n1p" },
  { part: "sealrow", h: "n2h", p: "n2p" },
  { part: "agents", h: "n3h", p: "n3p" },
];

/** The stage: scene tabs, the product on a monitor, and three notes that light one part. */
export function Stage({ locale, t }: { locale: Lang; t: Copy }) {
  const [scene, setScene] = useState<SceneId>("morning");
  const [part, setPart] = useState<Part | null>(null);
  const v = { t: productFor(locale), lang: locale };

  function pick(id: SceneId) {
    setScene(id);
    setPart(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = SCENE_IDS.indexOf(scene);
    const next = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: SCENE_IDS.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const id = SCENE_IDS[(next + SCENE_IDS.length) % SCENE_IDS.length]!;
    pick(id);
    document.getElementById(`tab-${id}`)?.focus();
  }

  return (
    <section className="stage" id="board" aria-labelledby="stage-h">
      <div className="wrap">
        <h2 id="stage-h" className="sr-only">
          {t.stageH}
        </h2>
        <div className="stage-top">
          <div className="tabs" role="tablist" aria-label={t.scenesLabel}>
            {SCENE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={scene === id}
                aria-controls="screen"
                tabIndex={scene === id ? 0 : -1}
                onClick={() => pick(id)}
                onKeyDown={onKeyDown}
              >
                {t[SCENE_LABEL[id]]}
              </button>
            ))}
          </div>
          <p>{t.stageCap}</p>
        </div>
        <div className="monitor">
          <div
            className="screen"
            id="screen"
            role="tabpanel"
            aria-labelledby={`tab-${scene}`}
            tabIndex={0}
          >
            <div className="sb sb-paper" data-hl={part ?? undefined}>
              <SbApp scene={SCENES[scene]} v={v} hl={part} />
            </div>
          </div>
          <div className="stand" aria-hidden="true" />
        </div>
        <div className="notes">
          {NOTES.map((n) => (
            <button
              key={n.part}
              type="button"
              className="note"
              aria-pressed={part === n.part}
              onClick={() => setPart(part === n.part ? null : n.part)}
            >
              <i className="dot" aria-hidden="true" />
              <b>{t[n.h]}</b>
              <span>{t[n.p]}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
