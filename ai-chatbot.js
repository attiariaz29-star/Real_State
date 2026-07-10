/**
 * NESTFINDER AI — SITE-WIDE HELP CHATBOT
 * A real, live AI assistant (not scripted/canned replies) that floats on
 * every page and helps users: find properties, understand areas, explain
 * how the site works, and answer general questions about buying/renting
 * in Pakistan.
 *
 * Uses the SAME free Groq API already set up in area-insight.js — no new
 * signup, no paid plan, no server needed. Just drop this one line before
 * </body> on any page:
 *
 *   <script src="ai-chatbot.js"></script>
 *
 * That's it — the widget builds its own button, chat window, and styles.
 */
(function () {
  "use strict";

  // ============================================
  // CONFIG — reuses the same free Groq key/model
  // already configured in area-insight.js
  // ============================================
  const AI_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
  const AI_MODEL = "llama-3.3-70b-versatile";
  const AI_KEY = "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";

  const SYSTEM_PROMPT = `You are "Nesty", the friendly built-in AI help assistant for NestFinder — a Pakistani real-estate website where people buy, rent, and research properties.

What you help with:
- Explaining how to use the site: Home (index.html), Area Insights (area-insight.html) for neighbourhood scores/comparisons, AI Match (ai-recommendations.html) for personalised property/area recommendations, Properties (property.html) to browse/search listings, Feedback (feedback.html), Account (acc.html), and Contact Us (connect.html).
- General guidance on buying vs renting, budgeting, what to check before renting/buying in Pakistan, area trade-offs (safety, affordability, connectivity), and how to interpret AI match scores.
- Being warm, concise, and practical. Prefer short paragraphs or short bullet lists. Reply in the same language/style the user writes in (English, Urdu, or Roman Urdu).
- If asked about a specific property price, availability, or booking, tell them to check the Properties page or use the Contact Us page to reach the team, since you don't have live listing data yourself.
- You do not have real-time access to the site's live database, so never invent specific prices, addresses, or listing IDs — speak in general, helpful terms and point them to the right page.
- Keep replies under ~120 words unless the user clearly wants more detail.`;

  // ============================================
  // STYLES
  // ============================================
  const css = `
  .nf-ai-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    width: 60px; height: 60px; border-radius: 50%; border: none;
    background: linear-gradient(135deg, #A68840, #1a1a1a);
    color: #fff; font-size: 26px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .nf-ai-fab:hover { transform: scale(1.07); box-shadow: 0 10px 30px rgba(0,0,0,0.45); }
  .nf-ai-fab .nf-ai-dot {
    position: absolute; top: 4px; right: 4px; width: 12px; height: 12px;
    background: #35c85a; border: 2px solid #fff; border-radius: 50%;
  }

  .nf-ai-panel {
    position: fixed; bottom: 96px; right: 24px; z-index: 99999;
    width: 360px; max-width: calc(100vw - 32px);
    height: 500px; max-height: calc(100vh - 140px);
    background: #fff; border-radius: 16px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    display: none; flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e8e4df;
  }
  .nf-ai-panel.nf-open { display: flex; }

  .nf-ai-header {
    background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
    color: #fff; padding: 14px 16px; display: flex; align-items: center; gap: 10px;
  }
  .nf-ai-header .nf-ai-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #A68840, #d4b876);
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .nf-ai-header .nf-ai-title { font-weight: 600; font-size: 15px; line-height: 1.2; }
  .nf-ai-header .nf-ai-sub { font-size: 11.5px; color: #c8b98a; display: flex; align-items: center; gap: 5px; }
  .nf-ai-header .nf-ai-sub::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #35c85a; display: inline-block; }
  .nf-ai-close {
    margin-left: auto; background: transparent; border: none; color: #fff;
    font-size: 20px; cursor: pointer; opacity: 0.75; line-height: 1;
  }
  .nf-ai-close:hover { opacity: 1; }

  .nf-ai-body {
    flex: 1; overflow-y: auto; padding: 14px; background: #f8f6f3;
    display: flex; flex-direction: column; gap: 10px;
  }
  .nf-ai-msg { max-width: 85%; padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
  .nf-ai-msg.bot { background: #fff; border: 1px solid #e8e4df; align-self: flex-start; border-bottom-left-radius: 4px; color: #1a1a1a; }
  .nf-ai-msg.user { background: #A68840; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
  .nf-ai-msg.err { background: #fdecea; border: 1px solid #f5c2c0; color: #a12622; align-self: flex-start; }

  .nf-ai-typing { display: flex; gap: 4px; align-self: flex-start; padding: 10px 12px; background: #fff; border: 1px solid #e8e4df; border-radius: 14px; border-bottom-left-radius: 4px; }
  .nf-ai-typing span { width: 6px; height: 6px; border-radius: 50%; background: #A68840; opacity: 0.5; animation: nfAiBlink 1.2s infinite ease-in-out; }
  .nf-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
  .nf-ai-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes nfAiBlink { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); } 40% { opacity: 1; transform: scale(1); } }

  .nf-ai-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; background: #f8f6f3; }
  .nf-ai-chip { border: 1px solid #d8cba8; background: #fff; color: #6b6b6b; font-size: 11.5px; padding: 5px 10px; border-radius: 999px; cursor: pointer; transition: all 0.15s; }
  .nf-ai-chip:hover { background: #A68840; color: #fff; border-color: #A68840; }

  .nf-ai-inputrow { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e8e4df; background: #fff; }
  .nf-ai-inputrow input {
    flex: 1; border: 1px solid #e8e4df; border-radius: 999px; padding: 9px 14px;
    font-size: 13.5px; outline: none; background: #f8f6f3; color: #1a1a1a;
  }
  .nf-ai-inputrow input:focus { border-color: #A68840; }
  .nf-ai-send {
    width: 38px; height: 38px; border-radius: 50%; border: none; flex-shrink: 0;
    background: #1a1a1a; color: #A68840; font-size: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .nf-ai-send:disabled { opacity: 0.5; cursor: not-allowed; }
  .nf-ai-send:hover:not(:disabled) { background: #A68840; color: #fff; }

  @media (max-width: 480px) {
    .nf-ai-panel { right: 16px; bottom: 88px; width: calc(100vw - 32px); }
    .nf-ai-fab { right: 16px; bottom: 16px; }
  }
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // ============================================
  // MARKUP
  // ============================================
  const fab = document.createElement("button");
  fab.className = "nf-ai-fab";
  fab.setAttribute("aria-label", "Chat with NestFinder AI");
  fab.innerHTML = `<i class="bi bi-chat-dots-fill"></i><span class="nf-ai-dot"></span>`;

  const panel = document.createElement("div");
  panel.className = "nf-ai-panel";
  panel.innerHTML = `
    <div class="nf-ai-header">
      <div class="nf-ai-avatar"><i class="bi bi-stars"></i></div>
      <div>
        <div class="nf-ai-title">Nesty — NestFinder AI</div>
        <div class="nf-ai-sub">Online, ask me anything</div>
      </div>
      <button class="nf-ai-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="nf-ai-body" id="nfAiBody"></div>
    <div class="nf-ai-suggestions" id="nfAiSuggestions">
      <button class="nf-ai-chip" data-q="How does AI Match work?">How does AI Match work?</button>
      <button class="nf-ai-chip" data-q="Best areas for a family in Karachi?">Best areas for families?</button>
      <button class="nf-ai-chip" data-q="Should I buy or rent right now?">Buy or rent?</button>
    </div>
    <div class="nf-ai-inputrow">
      <input type="text" id="nfAiInput" placeholder="Type your question..." autocomplete="off" />
      <button class="nf-ai-send" id="nfAiSend" aria-label="Send"><i class="bi bi-send-fill"></i></button>
    </div>
  `;

  document.addEventListener("DOMContentLoaded", mount);
  if (document.readyState === "complete" || document.readyState === "interactive") mount();

  function mount() {
    if (document.body && !document.getElementById("nfAiBody")) {
      document.body.appendChild(fab);
      document.body.appendChild(panel);
      wireUp();
    }
  }

  // ============================================
  // CHAT LOGIC
  // ============================================
  let history = []; // { role, content }
  let sending = false;

  function wireUp() {
    const body = panel.querySelector("#nfAiBody");
    const input = panel.querySelector("#nfAiInput");
    const send = panel.querySelector("#nfAiSend");
    const closeBtn = panel.querySelector(".nf-ai-close");
    const suggestions = panel.querySelector("#nfAiSuggestions");

    fab.addEventListener("click", () => {
      panel.classList.toggle("nf-open");
      if (panel.classList.contains("nf-open") && body.children.length === 0) {
        addMsg("bot", "Hi! I'm Nesty 👋 Ask me about areas, properties, or how NestFinder AI works.");
      }
    });
    closeBtn.addEventListener("click", () => panel.classList.remove("nf-open"));

    suggestions.addEventListener("click", (e) => {
      const q = e.target.getAttribute("data-q");
      if (q) { input.value = q; handleSend(); }
    });

    send.addEventListener("click", handleSend);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });

    function addMsg(role, text) {
      const div = document.createElement("div");
      div.className = "nf-ai-msg " + role;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    function showTyping() {
      const t = document.createElement("div");
      t.className = "nf-ai-typing";
      t.id = "nfAiTypingIndicator";
      t.innerHTML = "<span></span><span></span><span></span>";
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
    }
    function hideTyping() {
      const t = document.getElementById("nfAiTypingIndicator");
      if (t) t.remove();
    }

    async function handleSend() {
      const text = input.value.trim();
      if (!text || sending) return;
      input.value = "";
      addMsg("user", text);
      history.push({ role: "user", content: text });
      if (suggestions.parentNode) suggestions.remove();

      sending = true;
      send.disabled = true;
      showTyping();

      try {
        const reply = await callAI(history);
        hideTyping();
        addMsg("bot", reply);
        history.push({ role: "assistant", content: reply });
      } catch (err) {
        hideTyping();
        addMsg("err", "Sorry, I couldn't reach the AI service right now. " + (err && err.message ? err.message : ""));
      } finally {
        sending = false;
        send.disabled = false;
        input.focus();
      }
    }
  }

  async function callAI(msgHistory) {
    if (!AI_KEY || AI_KEY.startsWith("PASTE_")) {
      throw new Error("AI key not configured yet.");
    }
    const resp = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.6,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...msgHistory.slice(-12), // keep last 12 turns for context
        ],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`(${resp.status})`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't get a response — please try again.";
  }
})();
