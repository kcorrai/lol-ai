export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

// Components V2 has no embed footer, so the footer is a subtext line ("-# ")
// inside the container. Same wording as the webhook embeds in
// src/lib/discord/embeds.ts, so both surfaces sign off identically.
export const FOOTER_LINE = "-# lolaicoach.com · AI-powered LoL coaching";

export const BRAND_COLOR = 0x6366f1;
export const WIN_COLOR = 0x3cba8c;
export const LOSS_COLOR = 0xe84057;
