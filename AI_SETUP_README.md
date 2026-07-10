# NestFinder — Real AI Setup Guide (100% FREE — no paid plan needed)

## AI Recommendations page — FREE setup ✅ (do this one)

This is the AI you asked about (area matches, top picks, AI tips, market
commentary, area compare). It now runs on **Groq's free API**, called
directly from the browser. No Firebase billing, no credit card, no server.

### Setup (2 minutes)
1. Go to **https://console.groq.com/keys**
2. Sign up with Google/GitHub (no credit card required)
3. Click **"Create API Key"** and copy it
4. Open `area-insight.js`, find this line near the top:
   ```js
   const AI_PROVIDER_API_KEY = "PASTE_YOUR_FREE_GROQ_API_KEY_HERE";
   ```
5. Replace `PASTE_YOUR_FREE_GROQ_API_KEY_HERE` with your copied key (keep the quotes), save the file.
6. Open `ai-recommendations.html` in a browser (or upload the whole folder to your hosting) — done. Every score, reason, tip, and market summary is now a real, freshly-generated AI response.

### Is this really free?
Yes. Groq's free tier does not require billing details, and if you ever
exceed the free request limit it simply returns an error (not a charge).
Since the key lives in your browser's JavaScript, anyone who views your
page source could technically see it and use your free quota — that's an
acceptable trade-off for a free/student/personal project. If you later
want the key fully hidden server-side, you'd need a small backend (the
optional `aiRecommendations` Cloud Function in `functions/index.js` does
this, but needs Firebase's paid Blaze plan — **not required** for the
setup above to work).

---

## Property search bar (property.html) — now also real AI ✅

The search box on `property.html` now calls Groq's free API directly
from the browser too (same key/model as the AI Recommendations page and
the site-wide chat widget) — no more paid Firebase Blaze deployment or
OpenAI key required. Every filter it fills in (type, beds, baths, sale/
rent, budget tier, price range) and the one-line reply are generated
fresh by the real AI for each search. The old local keyword parser
(`parseAIQuery`) is kept only as a last-resort fallback if the AI call
fails (e.g. you're offline or hit the free-tier rate limit) — labeled
"offline mode" in the UI so it's clear when that happens.

The now-unused Firebase Cloud Function in `functions/index.js` is still
in the project as an optional alternative (fully server-side, key never
touches the browser) if you ever move to a paid Blaze plan — it isn't
required for anything above to work.
