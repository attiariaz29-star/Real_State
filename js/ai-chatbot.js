document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("chatSendBtn");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");
  if (!chatBtn || !chatInput || !chatMessages) return;

  chatBtn.addEventListener("click", async () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    chatMessages.innerHTML += `<div style="text-align:right;margin-bottom:8px"><span style="background:#4fc3f7;color:#16213e;padding:8px 12px;border-radius:12px 12px 4px 12px;display:inline-block">${msg}</span></div>`;
    chatInput.value = "";
    chatMessages.innerHTML += `<div style="text-align:left;margin-bottom:8px"><span style="background:#16213e;color:#e0e0e0;padding:8px 12px;border-radius:12px 12px 12px 4px;display:inline-block"><em>Thinking...</em></span></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const result = await AI_CONFIG.callGemini(msg, "You are a helpful real estate assistant for NestFinder. Answer questions about properties, buying, selling, mortgages, and market trends.");
    chatMessages.querySelector("div:last-child").innerHTML = `<div style="text-align:left;margin-bottom:8px"><span style="background:#16213e;color:#e0e0e0;padding:8px 12px;border-radius:12px 12px 12px 4px;display:inline-block">${result || 'Sorry, I encountered an error.'}</span></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") chatBtn.click();
  });
});
