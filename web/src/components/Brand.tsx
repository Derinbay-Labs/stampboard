import { Logo } from "./icons";

/** The Stampboard mark and name, not a link (used on the chooser and the 404). */
export function Brand() {
  return (
    <span className="mark">
      <Logo />
      <span>Stampboard</span>
    </span>
  );
}
