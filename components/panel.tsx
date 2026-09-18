import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { count } from "@/utils/count";
import { getSiteName } from "@/utils/sites";
import { Icon } from "./icon";
import { Setting } from "./setting";
import { StatusCard } from "./status-card";

type Settings = {
  enabled: boolean;
  review: boolean;
  remember: boolean;
  cloaked: number;
  saved: number;
};

export function Panel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [site, setSite] = useState<string | null>(null);

  useEffect(() => {
    browser.storage.local.get(["enabled", "review", "remember", "cloaked", "memory"]).then((s) =>
      setSettings({
        enabled: s.enabled !== false,
        review: s.review !== false,
        remember: s.remember !== false,
        cloaked: (s.cloaked as number) ?? 0,
        saved: Object.keys((s.memory as object) ?? {}).length,
      }),
    );
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => setSite(getSiteName(tab?.url)));
  }, []);

  const save = (patch: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    const { saved, ...stored } = patch;
    if (Object.keys(stored).length) void browser.storage.local.set(stored);
  };
  const handleForget = () => {
    void browser.storage.local.remove("memory");
    save({ saved: 0 });
  };

  return (
    <main aria-busy={!settings} className="min-h-screen bg-surface p-5 font-sans text-fg antialiased">
      <StatusCard
        on={settings?.enabled ?? true}
        cloaked={settings?.cloaked ?? 0}
        saved={settings?.saved ?? 0}
      />

      <p className="my-4 flex items-center gap-2 text-xs text-fg/45">
        <span className={`size-1.5 rounded-full ${site ? "bg-fg" : "bg-fg/30"}`} />
        {site ? `Watching this tab · ${site}` : "Not a site OpenCloak watches"}
      </p>

      <div className="flex flex-col gap-1.5">
        <Setting
          icon="shield"
          title="Protect"
          note="Read prompts before they are sent"
          on={settings?.enabled ?? true}
          disabled={!settings}
          onChange={(enabled) => save({ enabled })}
        />
        <Setting
          icon="review"
          title="Review"
          note="Show the swaps and wait"
          on={settings?.review ?? true}
          disabled={!settings}
          onChange={(review) => save({ review })}
        />
        <Setting
          icon="history"
          title="Remember"
          note="Same value, same fake"
          on={settings?.remember ?? true}
          disabled={!settings}
          onChange={(remember) => save({ remember })}
        />
      </div>

      {!!settings?.saved && (
        <button
          onClick={handleForget}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-fg/12 bg-transparent p-2.5 text-xs font-semibold text-fg/50 hover:border-fg/30 hover:text-fg"
        >
          <Icon name="trash" className="size-3.5" />
          Forget {count(settings.saved, "Saved Value", "Saved Values")}
        </button>
      )}

      <p className="mt-5 mb-0 text-xs leading-normal text-fg/35">
        Detection runs on this device. Reload an open tab after changing these.
      </p>
    </main>
  );
}
