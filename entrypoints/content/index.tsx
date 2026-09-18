import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";
import { defineContentScript, createShadowRootUi, type ContentScriptContext } from "#imports";
import { Anchored } from "@/components/anchored";
import { CloakCard } from "@/components/cloak-card";
import { Flash } from "@/components/flash";
import { apply, hydrate, known, remember, toItems, type Item } from "@/utils/cloak";
import { getComposer, readText, submit, writeText } from "@/utils/composer";
import { count } from "@/utils/count";
import { detect, warm } from "@/utils/detector";
import { reveal } from "@/utils/reveal";
import { SITES } from "@/utils/sites";
import "./style.css";

export default defineContentScript({
  matches: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://grok.com/*",
    "https://chat.deepseek.com/*",
  ],
  cssInjectionMode: "ui",

  async main(ctx) {
    const settings = await browser.storage.local.get(["enabled", "review"]);
    const protecting = settings.enabled !== false;

    window.postMessage({ opencloak: "guard", on: protecting }, "*");
    if (!protecting) return;

    const reviewing = settings.review !== false;
    const reusing = await hydrate();
    const site = SITES[location.hostname] ?? location.hostname;

    let composer: HTMLElement | null = null;
    let bypass = false;
    let busy = false;

    warm();
    watchReplies();

    document.addEventListener("focusin", (e) => {
      composer = getComposer(e.target) ?? composer;
    });

    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing || bypass) return;

        const el = getComposer(e.target);
        if (!el) return;

        if (busy) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        if (!readText(el).trim()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        review(el);
      },
      true,
    );

    document.addEventListener(
      "click",
      (e) => {
        if (bypass || busy) return;
        const target = e.target instanceof Element ? e.target : null;
        if (!target?.closest('button[data-testid="send-button"], button[aria-label*="send" i]')) return;
        const el = composer;
        if (!el || !readText(el).trim()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        review(el);
      },
      true,
    );

    async function review(el: HTMLElement) {
      busy = true;
      const text = readText(el);
      try {
        const items = toItems(text, await detect(text));

        // Only stop someone for details they have not already ruled on.
        if (items.length && reviewing && !(reusing && items.every(known))) {
          const decision = await ask(ctx, { text, found: items, site, anchor: el });
          if (decision === null) return;
          if (decision !== "raw") {
            remember(decision);
            await writeText(el, apply(text, decision));
            if (!(await cloaked(el, decision))) return stuck(ctx, el);
            void tally(decision.filter((i) => i.on).length);
          }
        } else if (items.some((i) => i.on)) {
          const swapped = items.filter((i) => i.on).length;
          await writeText(el, apply(text, items));
          if (!(await cloaked(el, items))) return stuck(ctx, el);
          void tally(swapped);
          flash(ctx, el, `${count(swapped, "detail", "details")} cloaked`);
        }
        send(el);
      } catch (error) {
        // Never trap someone's prompt because the detector had a bad day.
        console.warn("[OpenCloak] passing the prompt through:", error);
        send(el);
      } finally {
        busy = false;
      }
    }

    function send(el: HTMLElement) {
      bypass = true;
      // Rich editors re-render before the send button re-enables; give them a tick.
      setTimeout(() => {
        submit(el);
        setTimeout(() => (bypass = false), 0);
      }, 60);
    }
  },
});

/** A rich editor can ignore an edit, so check no real value is left in the
 *  box. Comparing strings would break on differing whitespace. */
async function cloaked(el: HTMLElement, items: Item[]) {
  const secrets = items.filter((i) => i.on).map((i) => i.real);

  for (let tries = 0; tries < 12; tries++) {
    if (!secrets.some((secret) => readText(el).includes(secret))) return true;
    await new Promise((settle) => setTimeout(settle, 25));
  }

  return false;
}

function stuck(ctx: ContentScriptContext, el: HTMLElement) {
  console.warn("[OpenCloak] the composer kept the original text; nothing was sent");
  void flash(ctx, el, "Could not rewrite the prompt — nothing was sent");
}

// ponytail: last write wins across tabs. It is a tally, not a ledger.
async function tally(swapped: number) {
  const { cloaked = 0 } = await browser.storage.local.get("cloaked");
  await browser.storage.local.set({ cloaked: (cloaked as number) + swapped });
}

type Ask = { text: string; found: Item[]; site: string; anchor: HTMLElement };

/** Resolves with the chosen items, "raw" to send as typed, or null to dismiss. */
function ask(ctx: ContentScriptContext, props: Ask): Promise<Item[] | "raw" | null> {
  return new Promise(async (resolve) => {
    const ui = await createShadowRootUi(ctx, {
      name: "opencloak-card",
      position: "inline",
      anchor: "body",
      onMount(container) {
        const root = ReactDOM.createRoot(container);

        function handleRetype() {
          done(null);
        }
        const done = (value: Item[] | "raw" | null) => {
          props.anchor.removeEventListener("input", handleRetype);
          resolve(value);
          ui.remove();
        };

        props.anchor.addEventListener("input", handleRetype);

        const { anchor, ...card } = props;

        root.render(
          <Anchored anchor={anchor}>
            <CloakCard
              {...card}
              onSend={(items) => done(items)}
              onSendRaw={() => done("raw")}
              onDismiss={() => done(null)}
            />
          </Anchored>,
        );
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    ui.mount();
  });
}

async function flash(ctx: ContentScriptContext, anchor: HTMLElement, message: string) {
  const ui = await createShadowRootUi(ctx, {
    name: "opencloak-flash",
    position: "inline",
    anchor: "body",
    onMount(container) {
      const root = ReactDOM.createRoot(container);
      root.render(
        <Anchored anchor={anchor}>
          <Flash message={message} />
        </Anchored>,
      );
      return root;
    },
    onRemove: (root) => root?.unmount(),
  });
  ui.mount();
  setTimeout(() => ui.remove(), 2800);
}

function watchReplies() {
  let queued = false;

  const swap = () => {
    queued = false;
    try {
      reveal(document.body);
    } catch (error) {
      console.warn("[OpenCloak] could not restore values in the page:", error);
    }
  };

  // ponytail: whole-body rescan per frame. Scope to the thread container if it drags.
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(swap);
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
}
