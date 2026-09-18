import { cn } from "cn";

const ICONS = {
  shield: {
    stroke: 1.7,
    paths: [
      "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      "m9 12 2 2 4-4",
    ],
  },
  close: { stroke: 1.7, paths: ["M18 6 6 18", "m6 6 12 12"] },
  check: { stroke: 3.2, paths: ["M20 6 9 17l-5-5"] },
  arrow: { stroke: 1.9, paths: ["M5 12h14", "m12 5 7 7-7 7"] },
  review: {
    stroke: 1.7,
    paths: [
      "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
      "M14 2v4a2 2 0 0 0 2 2h4",
      "m9 15 2 2 4-4",
    ],
  },
  history: {
    stroke: 1.7,
    paths: [
      "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
      "M3 3v5h5",
      "M12 7v5l3.5 2",
    ],
  },
  trash: {
    stroke: 1.7,
    paths: [
      "M3 6h18",
      "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
      "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    ],
  },
  rotate: {
    stroke: 1.9,
    paths: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
  },
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon(props: IconProps) {
  const { name, className } = props;
  const { stroke, paths } = ICONS[name];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
