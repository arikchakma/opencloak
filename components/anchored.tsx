import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { hostTheme, getPlacement } from "@/utils/theme";

type AnchoredProps = {
  anchor: HTMLElement;
  children: ReactNode;
};

const read = (anchor: HTMLElement) => ({ ...getPlacement(anchor), ...hostTheme(anchor) });

export function Anchored(props: AnchoredProps) {
  const { anchor, children } = props;
  const [box, setBox] = useState(() => read(anchor));

  useEffect(() => {
    const reposition = () => setBox(read(anchor));

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [anchor]);

  return (
    <div
      className="oc-root fixed z-[2147483000] flex justify-center font-sans text-fg"
      style={box as CSSProperties}
    >
      {children}
    </div>
  );
}
