import { en } from "./en";
import { tr } from "./tr";
import type { Copy, Lang } from "./types";

export const REPO_URL = "https://github.com/derinbay/stampboard";
export const CLONE_COMMAND = `git clone ${REPO_URL}.git\ncd stampboard && npm start`;

const COPY: Record<Lang, Copy> = { en, tr };

export function copyFor(lang: Lang): Copy {
  return COPY[lang];
}
