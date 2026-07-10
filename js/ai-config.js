const AI_CONFIG = {
  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY",
  OPENAI_API_KEY: "YOUR_OPENAI_API_KEY",
  getGeminiEndpoint: function () {
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`;
  },
  getOpenAIEndpoint: function () {
    return "https://api.openai.com/v1/chat/completions";
  },
  callGemini: async function (prompt, systemInstruction) {
    try {
      const res = await fetch(this.getGeminiEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
        })
      });
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
      console.error("AI_CONFIG.callGemini error:", e);
      return null;
    }
  },
  callOpenAI: async function (messages) {
    try {
      const res = await fetch(this.getOpenAIEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({ model: "gpt-4o", messages })
      });
      if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    } catch (e) {
      console.error("AI_CONFIG.callOpenAI error:", e);
      return null;
    }
  }
};
