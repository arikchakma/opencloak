import { createDetector, type Detector, type Span } from "gpu-pii";
import { browser } from "wxt/browser";

let loading: Promise<Detector> | null = null;

function load() {
  loading ??= createDetector({
    modelUrl: browser.runtime.getURL("/model.json"),
  }).then((r) => {
    if (!r.ok) {
      loading = null;
      throw new Error(`${r.error.code}: ${r.error.message}`);
    }
    return r.value;
  });
  return loading;
}

export function warm() {
  load().catch(() => {});
}

export async function detect(text: string): Promise<Span[]> {
  const result = await (await load()).detect(text);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}
