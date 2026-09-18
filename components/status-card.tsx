import { cva } from "class-variance-authority";
import { number } from "@/utils/count";
import { Icon } from "./icon";

const card = cva("rounded-3xl border p-5", {
  variants: {
    on: {
      true: "border-fg bg-fg text-surface",
      false: "border-fg/15 text-fg",
    },
  },
});

type StatusCardProps = {
  on: boolean;
  cloaked: number;
  saved: number;
};

export function StatusCard(props: StatusCardProps) {
  const { on, cloaked, saved } = props;

  return (
    <div className={card({ on })}>
      <Icon name="shield" className="size-5" />
      <p className="mt-4 mb-0 text-xl font-semibold tracking-tight">
        {on ? "Protected" : "Paused"}
      </p>
      <p className="mt-1 mb-0 text-xs opacity-60">
        {on
          ? "Nothing has left this device unread."
          : "Prompts are going out exactly as you type them."}
      </p>
      <div className="mt-4 flex gap-8 border-t border-current/20 pt-4">
        <Stat value={cloaked} label="details cloaked" />
        <Stat value={saved} label="values remembered" />
      </div>
    </div>
  );
}

type StatProps = {
  value: number;
  label: string;
};

function Stat(props: StatProps) {
  const { value, label } = props;

  return (
    <span>
      <span className="block text-2xl font-semibold tabular-nums">{number(value)}</span>
      <span className="block text-xs opacity-55">{label}</span>
    </span>
  );
}
