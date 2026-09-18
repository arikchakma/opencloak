import { defineConfig } from "wxt";
import { MATCHES } from "./utils/sites";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false,
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "OpenCloak",
    description:
      "Detects personal data in your AI prompts on-device and swaps it for believable fakes before it leaves your machine.",
    permissions: ["storage", "sidePanel"],
    host_permissions: MATCHES,
    action: {},
    web_accessible_resources: [
      {
        resources: ["model.json", "model.bin"],
        matches: ["https://*/*"],
      },
    ],
  },
});
