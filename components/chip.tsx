import { Checkbox } from "@base-ui/react/checkbox";
import { cva } from "class-variance-authority";
import type { MouseEvent } from "react";
import { reroll, type Item } from "@/utils/cloak";
import { Icon } from "./icon";

const chip = cva(
  "mx-px inline-flex h-7 items-center gap-1.5 rounded-lg border py-0 pr-1 pl-1.5 align-middle leading-none whitespace-nowrap",
  {
    variants: {
      cloaked: {
        true: "border-fg/10 bg-fg/5 hover:bg-fg/10",
        false: "border-dashed border-fg/20 hover:bg-fg/5",
      },
    },
  },
);

// border-solid is required: the chip sets --tw-border-style, which this inherits.
const tick = cva("flex size-4 items-center justify-center rounded-sm", {
  variants: {
    cloaked: { true: "bg-fg text-surface", false: "border-2 border-solid border-fg/30" },
  },
});

const real = cva("max-w-32 overflow-hidden text-ellipsis", {
  variants: { cloaked: { true: "text-fg/40 line-through decoration-1", false: "" } },
});

const fake = cva("", {
  variants: { cloaked: { true: "font-semibold", false: "font-medium text-fg/30" } },
});

type ChipProps = {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
};

export function Chip(props: ChipProps) {
  const { item, onChange } = props;
  const cloaked = item.on;

  const handleReroll = (event: MouseEvent) => {
    event.preventDefault();
    onChange({ fake: reroll(item), on: true });
  };

  return (
    <span className={chip({ cloaked })}>
      <Checkbox.Root
        checked={cloaked}
        onCheckedChange={(next) => onChange({ on: next })}
        aria-label={`Replace ${item.kind} ${item.real} with ${item.fake}`}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent p-0 text-inherit focus-visible:shadow-focus"
      >
        <span className={tick({ cloaked })}>
          <Checkbox.Indicator>
            <Icon name="check" className="size-2.5" />
          </Checkbox.Indicator>
        </span>
        <span className={real({ cloaked })}>{item.real}</span>
        <Icon name="arrow" className="size-3 text-fg/30" />
        <span className={fake({ cloaked })}>{item.fake}</span>
      </Checkbox.Root>
      <button
        onClick={handleReroll}
        aria-label={`Use a different ${item.kind}`}
        title="Use a Different One"
        className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 text-fg/40 transition-colors hover:bg-fg/10 hover:text-fg"
      >
        <Icon name="rotate" className="size-3" />
      </button>
      <span className="flex h-4 shrink-0 items-center rounded-sm bg-fg/5 px-1.5 text-kind font-semibold tracking-wider text-fg/40 uppercase">
        {item.kind}
      </span>
    </span>
  );
}
