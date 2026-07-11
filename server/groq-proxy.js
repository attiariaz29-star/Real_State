const http = require("http");
const url = require("url");
require("dotenv").config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || "gsk_xxxxxxxxxxxxxxxxxxxxxxxx";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PORT = 3002;

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendJSON(res, 204, "");
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/groq") {
    sendJSON(res, 404, { error: "Not found" });
    return;
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", async () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      sendJSON(res, 400, { error: "Invalid JSON" });
      return;
    }

    const { prompt, systemPrompt, temperature = 0.5, responseFormat } = parsed;

    if (!prompt) {
      sendJSON(res, 400, { error: "Missing prompt" });
      return;
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
      ...(responseFormat && { response_format: responseFormat })
    };

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq error:", response.status, errText);
        sendJSON(res, 502, { error: "Groq API error", details: errText });
        return;
      }

      const data = await response.json();
      sendJSON(res, 200, data);
    } catch (err) {
      console.error("Proxy error:", err.message);
      sendJSON(res, 500, { error: "Internal error", details: err.message });
    }
  });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Groq proxy running on http://localhost:${PORT}/api/groq`);
});