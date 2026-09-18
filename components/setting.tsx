import { Switch } from "@base-ui/react/switch";
import { Icon, type IconName } from "./icon";

type SettingProps = {
  icon: IconName;
  title: string;
  note: string;
  on: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
};

export function Setting(props: SettingProps) {
  const { icon, title, note, on, disabled, onChange } = props;

  return (
    <Switch.Root
      checked={on}
      disabled={disabled}
      onCheckedChange={onChange}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-fg/4 px-3 py-2.5 text-left hover:bg-fg/8 data-disabled:cursor-not-allowed data-disabled:opacity-50"
    >
      <Icon name={icon} className="text-fg/55" />
      <span className="flex-1">
        <strong className="block text-sm font-semibold">{title}</strong>
        <span className="block text-xs text-fg/40">{note}</span>
      </span>
      <span className="h-5 w-9 shrink-0 rounded-full bg-fg/20 transition-colors group-data-checked:bg-fg">
        <Switch.Thumb className="m-0.5 block size-4 rounded-full bg-surface transition-transform data-checked:translate-x-4" />
      </span>
    </Switch.Root>
  );
}
