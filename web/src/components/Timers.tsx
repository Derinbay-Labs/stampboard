"use client";

import { clock, hhmmss } from "@/lib/format";
import { useTicker } from "@/lib/ticker";

/** A running or waiting timer: `since` minutes at first paint, then one second per second. */
export function Elapsed({ sinceMin }: { sinceMin: number }) {
  const tick = useTicker();
  const extra = tick ? (tick.now - tick.start) / 1000 : 0;
  return <>{clock(sinceMin * 60 + extra)}</>;
}

/** The board's wall clock. Prerendered as `--:--` so the static HTML never shows a stale time. */
export function WallClock() {
  const tick = useTicker();
  if (!tick) return <>--:--</>;
  const { main, sec } = hhmmss(new Date(tick.now));
  return (
    <>
      {main}
      <span className="s">{sec}</span>
    </>
  );
}
