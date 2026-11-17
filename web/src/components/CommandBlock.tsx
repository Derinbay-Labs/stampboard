"use client";

import { useEffect, useRef, useState } from "react";
import { CLONE_COMMAND } from "@/content";
import { Icon } from "./icons";

export interface CommandLabels {
  copy: string;
  copied: string;
  copyFail: string;
}

type Status = "idle" | "copied" | "failed";
const RESET_MS = 1800;

/** The install command with a copy button; when copying fails the text is selected instead. */
export function CommandBlock({ labels }: { labels: CommandLabels }) {
  const pre = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), RESET_MS);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CLONE_COMMAND);
      setStatus("copied");
    } catch {
      const node = pre.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setStatus("failed");
    }
  }

  const ok = status === "copied";
  return (
    <>
      <div className="cmd">
        <pre ref={pre}>
          {CLONE_COMMAND.split("\n").map((line, i) => (
            <span key={line}>
              {i ? "\n" : ""}
              <span className="p" aria-hidden="true">
                ${" "}
              </span>
              {line}
            </span>
          ))}
        </pre>
        <button type="button" onClick={copy} data-state={ok ? "done" : undefined}>
          <Icon name={ok ? "check" : "copy"} />
          <span>{ok ? labels.copied : labels.copy}</span>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {status === "copied" ? labels.copied : status === "failed" ? labels.copyFail : ""}
      </span>
    </>
  );
}
