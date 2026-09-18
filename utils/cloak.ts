import { faker } from "@faker-js/faker";
import type { Label, Span } from "gpu-pii";
import { browser } from "wxt/browser";

export type Kind =
  | "first name"
  | "middle name"
  | "last name"
  | "building no."
  | "street"
  | "email"
  | "phone"
  | "date of birth"
  | "ssn"
  | "card"
  | "ip address";

export type Item = {
  start: number;
  end: number;
  real: string;
  fake: string;
  kind: Kind;
  on: boolean;
};

const GENERATE: Record<Kind, () => string> = {
  "first name": () => faker.person.firstName(),
  "middle name": () => faker.person.middleName(),
  "last name": () => faker.person.lastName(),
  "building no.": () => faker.location.buildingNumber(),
  street: () => faker.location.street(),
  email: () => faker.internet.email().toLowerCase(),
  phone: () => faker.phone.number({ style: "national" }),
  "date of birth": () =>
    faker.date.birthdate().toLocaleDateString("en-US"),
  ssn: () => `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`,
  card: () => faker.finance.creditCardNumber(),
  "ip address": () => faker.internet.ipv4(),
};

const SIMPLE: Partial<Record<Label, Kind>> = {
  EMAIL: "email",
  PHONE: "phone",
  DATE_OF_BIRTH: "date of birth",
  US_SSN: "ssn",
  PAYMENT_CARD: "card",
  IP_ADDRESS: "ip address",
};

const aliases = new Map<string, string>();
const choices = new Map<string, boolean>();
/** Keys are lowercased, so the original casing lives here. */
const reals = new Map<string, string>();
/** Fake -> real. Note the direction. */
export const restore = new Map<string, string>();

let remembering = true;

const key = (kind: Kind, real: string) => `${kind}\u0000${real.toLowerCase()}`;

type Remembered = { real: string; fake: string; on: boolean };

export async function hydrate(): Promise<boolean> {
  const { remember, memory } = (await browser.storage.local.get(["remember", "memory"])) as {
    remember?: boolean;
    memory?: Record<string, Remembered>;
  };
  remembering = remember !== false;
  if (!remembering || !memory) return remembering;

  for (const [k, past] of Object.entries(memory)) {
    aliases.set(k, past.fake);
    choices.set(k, past.on);
    if (past.on) restore.set(past.fake, past.real);
  }
  return remembering;
}

export const known = (item: Item) => choices.has(key(item.kind, item.real));

export function remember(items: Item[]) {
  if (!remembering) return;
  const memory: Record<string, Remembered> = {};
  for (const item of items) {
    const k = key(item.kind, item.real);
    choices.set(k, item.on);
    aliases.set(k, item.fake);
    reals.set(k, item.real);
  }
  for (const [k, fake] of aliases) {
    memory[k] = { real: reals.get(k) ?? k.slice(k.indexOf("\u0000") + 1), fake, on: choices.get(k) ?? true };
  }
  void browser.storage.local.set({ memory });
}

function alias(kind: Kind, real: string) {
  const k = key(kind, real);
  let fake = aliases.get(k);
  if (!fake) {
    fake = GENERATE[kind]();
    aliases.set(k, fake);
  }
  reals.set(k, real);
  return fake;
}

export function reroll(item: Item): string {
  const k = key(item.kind, item.real);
  let next = GENERATE[item.kind]();
  for (let i = 0; next === item.fake && i < 5; i++) next = GENERATE[item.kind]();
  aliases.set(k, next);
  return next;
}

/** The model labels a whole person or address as one span. Split those into
 *  parts a person recognises, so each can be kept or swapped on its own. */
function parts(text: string, span: Span): Array<{ start: number; end: number; kind: Kind }> {
  const raw = text.slice(span.start, span.end);

  if (span.label === "PERSON") {
    const words: Array<{ start: number; end: number }> = [];
    for (const m of raw.matchAll(/\S+/g)) {
      words.push({ start: span.start + m.index, end: span.start + m.index + m[0].length });
    }
    return words.map((w, i) => ({
      ...w,
      kind: i === 0 ? "first name" : i === words.length - 1 ? "last name" : "middle name",
    }));
  }

  if (span.label === "ADDRESS") {
    const number = /^\d+[a-z]?\b/i.exec(raw);
    if (!number) return [{ start: span.start, end: span.end, kind: "street" }];
    const rest = raw.slice(number[0].length);
    const offset = rest.length - rest.trimStart().length;
    const out: Array<{ start: number; end: number; kind: Kind }> = [
      { start: span.start, end: span.start + number[0].length, kind: "building no." },
    ];
    if (rest.trim()) {
      out.push({ start: span.start + number[0].length + offset, end: span.end, kind: "street" });
    }
    return out;
  }

  const kind = SIMPLE[span.label];
  return kind ? [{ start: span.start, end: span.end, kind }] : [];
}

export function toItems(text: string, spans: Span[]): Item[] {
  return [...spans]
    .sort((a, b) => a.start - b.start)
    .flatMap((span) => parts(text, span))
    .filter((p) => text.slice(p.start, p.end).trim().length > 0)
    .map((p) => {
      const real = text.slice(p.start, p.end);
      const on = choices.get(key(p.kind, real)) ?? true;
      return { ...p, real, fake: alias(p.kind, real), on };
    });
}

/** Also fills `restore`, which is how the reply is read back. */
export function apply(text: string, items: Item[]): string {
  let out = text;
  for (const item of [...items].sort((a, b) => b.start - a.start)) {
    if (!item.on) continue;
    out = out.slice(0, item.start) + item.fake + out.slice(item.end);
    restore.set(item.fake, item.real);
  }
  return out;
}
