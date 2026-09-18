// Run with: pnpm check
import assert from "node:assert/strict";
import type { Span } from "gpu-pii";

// Stand in for extension storage so the memory path can be exercised in node.
const disk: Record<string, unknown> = {};
(globalThis as Record<string, unknown>).chrome = {
  runtime: { id: "check" },
  storage: {
    local: {
      get: async (keys: string[]) => Object.fromEntries(keys.map((k) => [k, disk[k]])),
      set: async (values: Record<string, unknown>) => Object.assign(disk, values),
    },
  },
};

const { apply, hydrate, remember, restore, reroll, toItems } = await import("./cloak.ts");

const text = "Tell Peter Parker at 364 23rd St that peter@x.com is fine.";
const at = (s: string) => text.indexOf(s);
const span = (s: string, label: Span["label"]): Span => ({
  start: at(s),
  end: at(s) + s.length,
  label,
});

assert.equal(await hydrate(), true, "remembering is on by default");

const items = toItems(text, [
  span("peter@x.com", "EMAIL"),
  span("Peter Parker", "PERSON"),
  span("364 23rd St", "ADDRESS"),
]);

assert.deepEqual(
  items.map((i) => [i.kind, i.real]),
  [
    ["first name", "Peter"],
    ["last name", "Parker"],
    ["building no.", "364"],
    ["street", "23rd St"],
    ["email", "peter@x.com"],
  ],
);

assert.ok(items.every((i) => i.fake && i.fake !== i.real));
assert.ok(items.every((i) => i.on));

const cloaked = apply(text, items);
assert.ok(!cloaked.includes("Peter Parker"));
assert.ok(!cloaked.includes("peter@x.com"));
assert.ok(!cloaked.includes("364 23rd St"));
assert.ok(cloaked.startsWith("Tell ") && cloaked.endsWith(" is fine."));

let reply = `I told ${items[0].fake} ${items[1].fake} at ${items[3].fake}.`;
for (const [fake, real] of restore) reply = reply.replaceAll(fake, real);
assert.equal(reply, "I told Peter Parker at 23rd St.");

const again = toItems("Peter again", [{ start: 0, end: 5, label: "PERSON" }]);
assert.equal(again[0].fake, items[0].fake);

const rolled = reroll(items[0]);
assert.notEqual(rolled, items[0].fake);
assert.equal(toItems("Peter", [{ start: 0, end: 5, label: "PERSON" }])[0].fake, rolled);

const partial = apply(text, items.map((i) => ({ ...i, on: i.kind === "email" })));
assert.ok(partial.includes("Peter Parker at 364 23rd St"));
assert.ok(!partial.includes("peter@x.com"));

const decided = items.map((i) => ({ ...i, on: i.kind !== "street" }));
remember(decided);

const saved = disk.memory as Record<string, { real: string; fake: string; on: boolean }>;
assert.equal(saved["street\u000023rd st"].on, false);
assert.equal(saved["first name\u0000peter"].real, "Peter");

for (const k of Object.keys(restore)) restore.delete(k);
const fresh = await import(`./cloak.ts?reload=${Date.now()}`);
assert.equal(await fresh.hydrate(), true);
const rerun = fresh.toItems(text, [span("Peter Parker", "PERSON"), span("364 23rd St", "ADDRESS")]);
assert.deepEqual(
  rerun.map((i: { kind: string; on: boolean }) => [i.kind, i.on]),
  [
    ["first name", true],
    ["last name", true],
    ["building no.", true],
    ["street", false],
  ],
);
assert.equal(fresh.restore.get(rerun[0].fake), "Peter", "real casing is restored");

disk.remember = false;
const off = await import(`./cloak.ts?reload=${Date.now()}b`);
assert.equal(await off.hydrate(), false);
const blank = off.toItems(text, [span("364 23rd St", "ADDRESS")]);
assert.ok(blank.every((i: { on: boolean }) => i.on), "the kept street is not remembered");

const { count } = await import("./count.ts");
assert.equal(count(1, "detail", "details"), "1 detail");
assert.equal(count(0, "detail", "details"), "0 details");
assert.equal(count(1204, "choice", "choices"), "1,204 choices");

console.log("ok");
