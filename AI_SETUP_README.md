# NestFinder — AI Setup Guide (Secure Server-Side Architecture)

## Architecture Overview

All AI calls now route through **Firebase Cloud Functions** — the Groq API key
never touches the browser. This keeps your key secure and avoids exposing it
in client-side JavaScript.

```
Browser → Firebase Cloud Function (callGroq) → Groq API
           [GROQ_API_KEY stored as Firebase Secret]
```

## ONE-TIME SETUP (Firebase Cloud Functions)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Select your Firebase project
```bash
firebase use nestfinder-ai
```
(Or: `firebase use --add` to select from existing projects)

### 4. Set the Groq API key as a Firebase Secret
```bash
firebase functions:secrets:set GROQ_API_KEY
```
Paste your Groq API key when prompted.
Get a free key at https://console.groq.com/keys (no credit card required).

### 5. Install dependencies and deploy
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 6. Copy the deployed URL
After deployment, the CLI will print a URL like:
```
https://callgroq-xxxxxxxxxx-uc.a.run.app
```

### 7. Update ai-config.js
Open `ai-config.js` and paste the URL:
```js
const AI_CONFIG = {
    model: 'llama-3.3-70b-versatile',
    ZENSERP_FUNCTION_URL: '/api/zenserp',
    GROQ_FUNCTION_URL: 'https://callgroq-xxxxxxxxxx-uc.a.run.app'
};
```

### 8. (Optional) Zenserp web search
If you want web search fallback in the AI Property Advisor:
```bash
firebase functions:secrets:set ZENSERP_API_KEY
firebase deploy --only functions
```
Get a free Zenserp key at https://zenserp.com

### 9. (Optional) OpenAI key
The `aiRecommendations` and `aiPropertySearch` functions use OpenAI:
```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

## What changed?

- **Before**: Groq API key was hardcoded in multiple frontend files
  (`js/ai-engine.js`, `ai-chatbot.js`, `area-insight-app.js`, `area-insight.js`,
  `ai-config.js`) and called directly from the browser — anyone viewing page
  source could see the key.

- **After**: All Groq calls go through the `callGroq` Firebase Cloud Function.
  The API key is stored as a Firebase secret and never sent to the client.
  The frontend sends `{ prompt, systemPrompt, temperature }` and receives
  the exact same response shape as before — no downstream code changes needed.

## Files that reference the Cloud Function

- `ai-config.js` — contains `GROQ_FUNCTION_URL`
- `js/ai-engine.js` — uses `AI_CONFIG.GROQ_FUNCTION_URL`
- `ai-chatbot.js` — uses `AI_CONFIG.GROQ_FUNCTION_URL`
- `area-insight-app.js` — uses `AI_CONFIG.GROQ_FUNCTION_URL`
- `area-insight.js` — uses `AI_CONFIG.GROQ_FUNCTION_URL`
