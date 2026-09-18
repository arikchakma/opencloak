# Third-party notices

OpenCloak is built with third-party software. Their names identify upstream projects and do not imply endorsement.

A browser extension ships as one bundle, so everything under "Bundled" below is redistributed inside the packaged extension. Everything under "Build and development" is not.

## Bundled

Detection is [gpu-pii](https://www.npmjs.com/package/gpu-pii). The extension bundles its WebGPU runtime and copies its two model files, `model.json` and `model.bin`, into the package unchanged. Copyright in that software and in those weights remains with its author.

That model was trained on [NVIDIA Nemotron-PII](https://huggingface.co/datasets/nvidia/Nemotron-PII), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Amy Steier, Andre Manoel, Alexa Haushalter, and Maarten Van Segbroeck. *Nemotron-PII: Synthesized Data for Privacy-Preserving AI*. NVIDIA, 2025. The corpus itself is not redistributed here.

The interface is built with [React](https://github.com/facebook/react) and [React DOM](https://github.com/facebook/react) (MIT), [Base UI](https://github.com/mui/base-ui) (MIT) for the switch and checkbox, [cn](https://github.com/shadcn-ui/cn) (MIT) for class merging, and [class-variance-authority](https://github.com/joe-bell/cva) (Apache-2.0) for component variants. Replacement values come from [Faker](https://github.com/faker-js/faker) (MIT).

## Build and development

The extension is built with [WXT](https://github.com/wxt-dev/wxt), [Vite](https://github.com/vitejs/vite), [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), and [TypeScript](https://github.com/microsoft/TypeScript), each under their respective open-source licenses. None of these ship in the package.

The cover image in `_static/` is rendered from a local HTML file with headless Chrome and [ImageMagick](https://imagemagick.org). It sets type in Departure Mono and Geist Mono, which are installed on the machine that renders it. Neither font is redistributed here.

The layout of that cover and of this repository's documentation follows [shinro](https://github.com/arikchakma/shinro). No code from it is included.
