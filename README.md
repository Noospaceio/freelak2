# 🌿 FreeLakito ($FREELAK)

Official landing page for **$FREELAK** — a Solana memecoin. Built with Next.js 13 (App Router), TailwindCSS, TypeScript, and Framer Motion.

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the site.

## ⚙️ Before you deploy

Edit the constants at the top of `app/page.tsx`:

```ts
const TICKER        = '$FREELAK';
const TOTAL_SUPPLY   = '22,222';
const CONTRACT_ADDR  = 'PASTE_CONTRACT_ADDRESS_HERE'; // ← Solana mint address
const X_LINK         = 'https://x.com/freelakito';    // ← your X/Twitter link
const TG_LINK        = 'https://t.me/freelakito';     // ← your Telegram link
```

Also replace the placeholder story text in the "Story" section with the real story.

## 📦 Deployment

Deploy instantly with [Vercel](https://vercel.com):

1. Push this repo to GitHub
2. Import it into Vercel
3. Deploy — no environment variables required

## ✨ Features

- Animated hero with canvas "growth field" effect
- Sticky nav with mobile menu
- Animated supply counter
- Tokenomics section
- Step-by-step "How to buy" guide
- Copy-to-clipboard contract address

---

© 2026 FreeLakito · Solana
