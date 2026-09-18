import { restore } from "./cloak";

/** Styled inline: these marks sit in the host page's DOM, out of reach of the
 *  card's shadow-root stylesheet, and inline styles beat the page's CSS. */
const MARK = "data-opencloak";

/** Mixed toward `currentColor` below, so one declaration darkens on a light
 *  page and lightens on a dark one. */
const ACCENT = "#7c62f5";

/** Code and state, not prose. Rewriting it can break the page. */
const OFF_LIMITS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TITLE"]);

let tip: HTMLDivElement | null = null;

function tooltip() {
  if (tip?.isConnected) return tip;
  tip = document.createElement("div");
  tip.setAttribute(MARK, "tip");
  tip.style.cssText = [
    "position:fixed",
    "z-index:2147483000",
    "padding:5px 9px",
    "border-radius:7px",
    "background:#111",
    "color:#fff",
    "border:1px solid rgba(255,255,255,.16)",
    "font:500 12px/1.4 ui-sans-serif,system-ui,sans-serif",
    "pointer-events:none",
    "opacity:0",
    "transition:opacity 90ms ease",
    "max-width:260px",
    "overflow-wrap:anywhere",
  ].join(";");
  document.body.append(tip);
  return tip;
}

function show(mark: HTMLElement, sent: string) {
  const el = tooltip();
  el.textContent = `Sent as “${sent}”`;
  el.style.opacity = "1";

  const box = mark.getBoundingClientRect();
  const self = el.getBoundingClientRect();
  el.style.left = `${Math.max(8, Math.min(box.left, window.innerWidth - self.width - 8))}px`;
  el.style.top = `${box.top > self.height + 10 ? box.top - self.height - 6 : box.bottom + 6}px`;
}

const hide = () => {
  if (tip) tip.style.opacity = "0";
};

function mark(real: string, sent: string) {
  const el = document.createElement("span");
  el.setAttribute(MARK, "real");
  el.textContent = real;
  el.tabIndex = 0;
  el.setAttribute("aria-label", `${real} — sent as ${sent}`);
  el.style.cssText = [
    "display:inline",
    "border-radius:5px",
    "padding:1px 5px",
    "margin:0 -2px",
    `background:color-mix(in srgb, ${ACCENT} 20%, transparent)`,
    `color:color-mix(in srgb, ${ACCENT} 55%, currentColor)`,
    "cursor:help",
  ].join(";");
  el.addEventListener("mouseenter", () => show(el, sent));
  el.addEventListener("focus", () => show(el, sent));
  el.addEventListener("mouseleave", hide);
  el.addEventListener("blur", hide);
  return el;
}

// ponytail: React re-renders over these marks; the caller re-runs on mutation
// to put them back. A real fix needs per-site knowledge of when a reply ends.
export function reveal(root: HTMLElement) {
  if (!restore.size) return;

  const pattern = new RegExp(
    [...restore.keys()]
      .sort((a, b) => b.length - a.length)
      .map((fake) => fake.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "g",
  );

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: Text[] = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    pattern.lastIndex = 0;
    if (!pattern.test(text)) continue;

    const parent = node.parentElement;
    if (!parent || OFF_LIMITS.has(parent.tagName)) continue;
    if (parent.closest(`[contenteditable="true"], textarea, [${MARK}]`)) continue;
    hits.push(node as Text);
  }

  for (const node of hits) {
    const text = node.nodeValue ?? "";
    const parts = document.createDocumentFragment();
    let cursor = 0;

    pattern.lastIndex = 0;
    for (let hit = pattern.exec(text); hit; hit = pattern.exec(text)) {
      const real = restore.get(hit[0]);
      if (!real) continue;
      if (hit.index > cursor) parts.append(text.slice(cursor, hit.index));
      parts.append(mark(real, hit[0]));
      cursor = hit.index + hit[0].length;
    }

    if (cursor < text.length) parts.append(text.slice(cursor));
    node.parentNode?.replaceChild(parts, node);
  }
}
