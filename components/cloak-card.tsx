import { useEffect, useRef, useState } from "react";
import type { Item } from "@/utils/cloak";
import { count } from "@/utils/count";
import { Icon } from "./icon";
import { Sentence } from "./sentence";

type CloakCardProps = {
  text: string;
  found: Item[];
  site: string;
  onSend: (items: Item[]) => void;
  onSendRaw: () => void;
  onDismiss: () => void;
};

export function CloakCard(props: CloakCardProps) {
  const { text, found, site, onSend, onSendRaw, onDismiss } = props;

  const [items, setItems] = useState(found);
  const sendRef = useRef<HTMLButtonElement>(null);

  const on = items.filter((i) => i.on).length;

  useEffect(() => sendRef.current?.focus(), []);

  const handleChange = (index: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Review personal data before sending to ${site}`}
      className="oc-in flex max-h-[72vh] w-full flex-col rounded-host border border-fg/10 bg-surface shadow-card"
      onKeyDown={(e) => {
        if (e.key === "Escape") onDismiss();
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend(items);
      }}
    >
      <header className="flex items-center gap-2 px-4 py-2">
        <Icon name="shield" className="text-fg/80" />
        <h2 className="m-0 flex-1 text-sm leading-none font-semibold">
          {count(items.length, "Detail", "Details")} Would Identify You
        </h2>
        <span className="text-xs leading-none text-fg/40">Untick to Keep One Real</span>
        <button
          onClick={onDismiss}
          aria-label="Keep editing"
          className="-mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent p-0 text-fg/40 hover:bg-fg/5 hover:text-fg"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </header>

      <div className="overflow-y-auto border border-fg/5 bg-fg/5 p-4 text-sm leading-8.25 whitespace-pre-wrap wrap-anywhere">
        <Sentence text={text} items={items} onChange={handleChange} />
      </div>

      <footer className="flex items-center px-4 py-4">
        <span className="flex-1 text-xs leading-none text-fg/40">
          Replacements Stay the Same Next Time
        </span>
        <button
          onClick={onSendRaw}
          className="h-9 cursor-pointer rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-fg/50 hover:bg-fg/5 hover:text-fg"
        >
          Send as Typed
        </button>
        <button
          ref={sendRef}
          onClick={() => onSend(items)}
          disabled={!on}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border-0 bg-fg px-4 text-sm font-semibold text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Send Cloaked
          <span className="flex h-5 items-center rounded-full bg-surface/20 px-1.5 text-xs font-semibold tabular-nums">
            {on}
          </span>
        </button>
      </footer>
    </div>
  );
}
