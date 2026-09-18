import { browser } from "wxt/browser";
import { defineBackground } from "#imports";

type SidePanel = { setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void> };

export default defineBackground(() => {
  const sidePanel = (browser as unknown as { sidePanel?: SidePanel }).sidePanel;
  void sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});
