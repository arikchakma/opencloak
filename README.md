![OpenCloak](_static/opencloak-thumbnail.jpg)

<p align="center">Swap the personal details out of your AI prompts before they are sent.</p>

OpenCloak reads a prompt on your own machine and finds the details that identify you. It
then offers believable fakes in their place. The model runs on your GPU through WebGPU, so
the text never leaves the device to be read.

Press Enter on ChatGPT, Claude, Gemini, Perplexity, Grok or DeepSeek, and OpenCloak holds
the prompt. A card opens above the composer and shows the prompt as it would be sent. Each
detail is a chip. You can untick a chip to keep the real value, or reroll it for a
different fake. After you send, the reply comes back in your own terms, and OpenCloak
marks each restored value with the fake that the model received.

## Why OpenCloak

Detection and replacement both happen in the page. There is no server and no account. No
network call carries your prompt anywhere but where you meant to send it.

- [`gpu-pii`](https://www.npmjs.com/package/gpu-pii) runs on WebGPU inside the content
  script. It finds names, addresses, emails, phone numbers, dates of birth, SSNs, card
  numbers and IP addresses on your own device.
- ChatGPT sends the characters you type to its server before you press send. A guard in
  the page's own world answers that request locally, so the card is not the only thing
  between you and a leak.
- The card shows the prompt as it would really be sent, then waits for you. If you turn
  Review off, OpenCloak cloaks the prompt and sends it without asking.
- A value keeps the same fake every time. A prompt about "Peter" stays coherent when the
  model answers about "Ralph". Only details you have not ruled on before interrupt you.
- OpenCloak puts your real values back into the page as the reply renders. Hover a
  restored value to see what the model received.
- The card samples the surface color and corner radius of the host page. It looks native
  on all six sites, and it needs no palette for each one.

## Development

```sh
pnpm install
pnpm dev
pnpm check
pnpm compile
pnpm build
```

`pnpm install` also copies the model files into `public/`. To load a build by hand, run
`pnpm build`. Then open Extensions in Chrome, turn on Developer mode, and choose **Load
unpacked** on `.output/chrome-mv3`.

## Known edges

- The model is experimental. Treat a clean scan as "nothing obvious found", not as proof
  that the text is safe to share.
- The guard covers ChatGPT. Other sites can prefetch too, and none of them is handled yet.
- To rewrite the prompt, OpenCloak tries `execCommand("insertText")`, then a synthetic
  paste, then writing the DOM directly. If none of them take, it refuses to send rather
  than let the real text through.
- OpenCloak swaps a fake back wherever it appears in a reply. A fake that happens to be a
  common word can be restored somewhere you did not mean it to be.
- Restoring real values in a streaming reply works on whole text nodes. A fake split
  across two streamed chunks is missed until that node settles.
- A switch in the side panel takes effect on the next page load.

## Acknowledgements

OpenCloak builds on:

- [gpu-pii](https://www.npmjs.com/package/gpu-pii) — the on-device detector. An
  experimental PII model trained from scratch, run through WebGPU.
- [NVIDIA Nemotron-PII](https://huggingface.co/datasets/nvidia/Nemotron-PII) — the training
  data behind that model, under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Amy Steier, Andre Manoel,
  Alexa Haushalter, and Maarten Van Segbroeck. *Nemotron-PII: Synthesized Data for
  Privacy-Preserving AI*. NVIDIA, 2025.
- [WXT](https://wxt.dev) — the extension toolchain, for entrypoints, the shadow-root UI and
  the build.
- [Base UI](https://base-ui.com) — the switch and checkbox behavior, which survives being
  rendered inside a shadow root.
- [Faker](https://fakerjs.dev) — the replacement values.

## License

MIT © Arik Chakma. The on-device model, its training data, and the libraries the extension
bundles retain their own licenses, listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
