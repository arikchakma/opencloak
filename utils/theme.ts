export function hostTheme(anchor: HTMLElement): Record<string, string> {
  const shell = getComposerShell(anchor);
  const style = getComputedStyle(shell);
  const surface = getSurfaceColor(shell);

  return {
    "--oc-bg": surface,
    "--oc-fg": isDark(surface) ? "#ffffff" : "#000000",
    "--oc-radius": `${clamp(parseFloat(style.borderTopLeftRadius) || 16, 12, 28)}px`,
  };
}

/** The visible composer panel, not the bare editable inside it. That panel is
 *  what the card lines up with. */
export function getComposerShell(el: HTMLElement): HTMLElement {
  for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (parseFloat(style.borderTopLeftRadius) > 8 && painted(style.backgroundColor)) return node;
  }

  return el.closest<HTMLElement>("form") ?? el;
}

function getSurfaceColor(el: HTMLElement | null): string {
  for (let node = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (painted(bg)) return bg;
  }

  return getComputedStyle(document.body).backgroundColor || "#ffffff";
}

const painted = (bg: string) => !!bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

// Canvas normalises any CSS colour to #rrggbb, so no colour parsing here.
const probe = document.createElement("canvas").getContext("2d");

function isDark(color: string): boolean {
  if (!probe) return prefersDark();

  probe.fillStyle = "#abcdef";
  probe.fillStyle = color;

  const hex = String(probe.fillStyle);
  if (hex === "#abcdef" || hex[0] !== "#") return prefersDark();

  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}

const prefersDark = () => matchMedia("(prefers-color-scheme: dark)").matches;

const GAP = 14;
const MIN_WIDTH = 420;

export function getPlacement(anchor: HTMLElement) {
  const r = getComposerShell(anchor).getBoundingClientRect();
  if (!r.width) return { left: 16, right: 16, bottom: 24 };

  const room = window.innerWidth - 24;
  const width = Math.min(Math.max(r.width, MIN_WIDTH), room);
  return {
    left: Math.min(Math.max(12, r.left + (r.width - width) / 2), room - width + 12),
    width,
    bottom: Math.min(window.innerHeight - r.top + GAP, window.innerHeight - 80),
  };
}
