import { defineContentScript } from "#imports";

/** Ships the characters being typed. Nothing needs its answer. */
const TYPED_TEXT = /generate_autocompletions/i;

/** Carries the token a real send needs, so it has to reach the network. */
const HANDSHAKE = /\/(prepare|chat-requirements)(\b|[?/]|$)/i;

const PROMPT_FIELD =
  /^(prompt|prompts|prefix|suffix|text|content|parts|message|messages|input|inputs|query)$/i;

/**
 * ChatGPT sends what you are typing to its server before you press send, so the
 * card can never have protected it. Runs in the page's own world at
 * document_start, before the app takes its own reference to `fetch`.
 */
export default defineContentScript({
  matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  runAt: "document_start",
  world: "MAIN",

  main() {
    // Closed until the extension says otherwise: the gap before the other
    // content script loads must not leak.
    let guarding = true;

    window.addEventListener("message", (e) => {
      if (e.source !== window || e.data?.opencloak !== "guard") return;
      guarding = e.data.on !== false;
    });

    const getUrl = (input: unknown) =>
      typeof input === "string" ? input : String((input as Request)?.url ?? input ?? "");

    const leaks = (url: string) => guarding && TYPED_TEXT.test(url);
    const carries = (url: string) => guarding && HANDSHAKE.test(url);

    function strip(node: unknown): unknown {
      if (Array.isArray(node)) return node.map(strip);
      if (node && typeof node === "object") {
        return Object.fromEntries(
          Object.entries(node).map(([k, v]) => [
            k,
            PROMPT_FIELD.test(k) ? blank(v) : strip(v),
          ]),
        );
      }
      return node;
    }

    const blank = (v: unknown): unknown =>
      typeof v === "string" ? "" : Array.isArray(v) || (v && typeof v === "object") ? strip(v) : v;

    function stripBody(body: string) {
      try {
        return JSON.stringify(strip(JSON.parse(body)));
      } catch {
        return body;
      }
    }

    const nativeFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = getUrl(input);

      if (leaks(url)) {
        return Promise.resolve(
          new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
        );
      }

      if (carries(url) && typeof init?.body === "string") {
        return nativeFetch.call(this, input, { ...init, body: stripBody(init.body) });
      }

      if (carries(url) && input instanceof Request) {
        return input
          .clone()
          .text()
          .then((body) =>
            nativeFetch.call(this, new Request(input, { body: stripBody(body) }), init),
          );
      }

      return nativeFetch.call(this, input, init);
    };

    type Guarded = XMLHttpRequest & { ocBlock?: boolean; ocStrip?: boolean };

    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (this: Guarded, method: string, url: string | URL) {
      this.ocBlock = leaks(String(url));
      this.ocStrip = !this.ocBlock && carries(String(url));
      // eslint-disable-next-line prefer-rest-params
      return nativeOpen.apply(this, arguments as never);
    };

    XMLHttpRequest.prototype.send = function (this: Guarded, body?: unknown) {
      if (this.ocBlock) {
        // Answer it locally. The text must not reach the network.
        setTimeout(() => {
          for (const [key, value] of [
            ["readyState", 4],
            ["status", 200],
            ["responseText", "{}"],
            ["response", "{}"],
          ] as const) {
            Object.defineProperty(this, key, { value, configurable: true });
          }
          this.dispatchEvent(new Event("readystatechange"));
          this.dispatchEvent(new Event("load"));
          this.dispatchEvent(new Event("loadend"));
        }, 0);
        return;
      }
      if (this.ocStrip && typeof body === "string") return nativeSend.call(this, stripBody(body));
      return nativeSend.call(this, body as XMLHttpRequestBodyInit);
    };
  },
});
