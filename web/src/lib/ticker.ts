import { useSyncExternalStore } from "react";

/**
 * One shared one-second ticker for every running timer and the wall clock. The server
 * snapshot is `null`, so the prerendered HTML and the first client render agree exactly;
 * the first tick after hydration switches to real time.
 */
export type Tick = { start: number; now: number } | null;

let snapshot: Tick = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    const start = snapshot?.start ?? Date.now();
    snapshot = { start, now: Date.now() };
    timer = setInterval(() => {
      snapshot = { start, now: Date.now() };
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useTicker(): Tick {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
