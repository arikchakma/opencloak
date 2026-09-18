export const SITES: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "www.perplexity.ai": "Perplexity",
  "grok.com": "Grok",
  "chat.deepseek.com": "DeepSeek",
};

export const MATCHES = Object.keys(SITES).map((host) => `https://${host}/*`);

export function getSiteName(url: string | undefined) {
  if (!url) return null;
  try {
    return SITES[new URL(url).hostname] ?? null;
  } catch {
    return null;
  }
}
