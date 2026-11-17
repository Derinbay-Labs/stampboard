const pad = (n: number) => String(n).padStart(2, "0");

/** `mm:ss` or `h:mm:ss` from whole seconds. */
export function clock(sec: number): string {
  const s0 = Math.max(0, Math.floor(sec));
  const h = Math.floor(s0 / 3600);
  const m = Math.floor(s0 / 60) % 60;
  const s = s0 % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Stable hue (0-359) from a name, so a runner keeps its plate colour. */
export function hue(name: string): number {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/** `12 m`, `5 h`, `3 d` from minutes. */
export function age(min: number, units: readonly [string, string, string]): string {
  const [mi, ho, da] = units;
  if (min < 60) return `${min} ${mi}`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} ${ho}` : `${Math.floor(h / 24)} ${da}`;
}

/** Wall-clock parts for the board header: `HH:MM` and `:SS`. */
export function hhmmss(d: Date): { main: string; sec: string } {
  return {
    main: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    sec: `:${pad(d.getSeconds())}`,
  };
}
