import type { Item } from "@/utils/cloak";
import { Chip } from "./chip";

type SentenceProps = {
  text: string;
  items: Item[];
  onChange: (index: number, patch: Partial<Item>) => void;
};

export function Sentence(props: SentenceProps) {
  const { text, items, onChange } = props;
  const nodes = [];
  let cursor = 0;

  items.forEach((item, i) => {
    if (item.start > cursor) nodes.push(<span key={`t${i}`}>{text.slice(cursor, item.start)}</span>);
    nodes.push(<Chip key={`c${i}`} item={item} onChange={(patch) => onChange(i, patch)} />);
    cursor = item.end;
  });
  nodes.push(<span key="tail">{text.slice(cursor)}</span>);

  return <>{nodes}</>;
}
