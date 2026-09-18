const SEND_BUTTON = [
  'button[data-testid="send-button"]',
  'button[aria-label*="send" i]',
  'form button[type="submit"]',
].join(", ");

export function getComposer(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest<HTMLElement>('textarea, [contenteditable="true"]');
  return el?.isContentEditable || el instanceof HTMLTextAreaElement ? el : null;
}

export function readText(el: HTMLElement): string {
  return el instanceof HTMLTextAreaElement ? el.value : el.innerText;
}

const flat = (text: string) => text.replace(/\s+/g, " ").trim();

function selectAll(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function insertWithCommand(_el: HTMLElement, text: string) {
  document.execCommand("insertText", false, text);
}

function insertWithPaste(el: HTMLElement, text: string) {
  const data = new DataTransfer();
  data.setData("text/plain", text);
  el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
}

function insertIntoDom(el: HTMLElement, text: string) {
  el.textContent = text;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}

function waitForText(el: HTMLElement, text: string) {
  const want = flat(text);
  return new Promise<boolean>((done) => {
    let tries = 0;
    const check = () => {
      if (flat(readText(el)) === want) return done(true);
      if (++tries > 8) return done(false);
      setTimeout(check, 20);
    };
    check();
  });
}

/** Rich editors each honour a different one of these, so escalate until the
 *  box reads back what we wrote. */
export async function writeText(el: HTMLElement, text: string) {
  el.focus();

  if (el instanceof HTMLTextAreaElement) {
    // React tracks the last value it wrote, so go through the native setter.
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));

    return true;
  }

  for (const attempt of [insertWithCommand, insertWithPaste, insertIntoDom]) {
    selectAll(el);
    attempt(el, text);
    if (await waitForText(el, text)) return true;
  }

  return false;
}

export function submit(el: HTMLElement) {
  const scope = el.closest("form") ?? el.parentElement?.closest("div") ?? document;
  const button = [
    ...scope.querySelectorAll<HTMLButtonElement>(SEND_BUTTON),
    ...document.querySelectorAll<HTMLButtonElement>(SEND_BUTTON),
  ].find((b) => !b.disabled && b.offsetParent !== null);

  if (button) {
    button.click();
    return;
  }

  el.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }),
  );
}
