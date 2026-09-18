import { Icon } from "./icon";

type FlashProps = {
  message: string;
};

export function Flash(props: FlashProps) {
  const { message } = props;

  return (
    <div
      role="status"
      className="oc-in inline-flex h-9 items-center gap-2 rounded-full border border-fg/10 bg-surface pr-4 pl-3 text-xs font-medium shadow-pill"
    >
      <Icon name="shield" className="text-fg/50" />
      {message}
    </div>
  );
}
