/**
 * NestFinder AI — Cloud Function: aiPropertySearch
 * ---------------------------------------------------------------
 * Receives a free-text property search query from the browser,
 * sends it to OpenAI to extract structured filters + a friendly
 * natural-language reply, and returns that JSON to the client.
 *
 * The OpenAI API key NEVER touches the browser — it lives only as a
 * Firebase secret on this function, which is the whole point of
 * routing the call through here instead of calling OpenAI directly
 * from property.html.
 *
 * ONE-TIME SETUP (run these from the "real state" folder):
 *   1. npm install -g firebase-tools          (if not already installed)
 *   2. firebase login
 *   3. firebase use nestfinder-ai              (or: firebase use --add)
 *   4. firebase functions:secrets:set OPENAI_API_KEY
 *        -> paste your OpenAI key when prompted
 *   5. cd functions && npm install && cd ..
 *   6. firebase deploy --only functions
 *
 * Deploy will print a URL like:
 *   https://aipropertysearch-xxxxxxxxxx-uc.a.run.app
 * Copy that URL into AI_SEARCH_ENDPOINT in property.html.
 * ---------------------------------------------------------------
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const ZENSERP_SECRET = defineSecret("ZENSERP_API_KEY");

const SYSTEM_PROMPT = `You are the search-query parser for NestFinder AI, a Pakistani real-estate site (Karachi, Lahore, Islamabad).
Read the user's free-text property search (may be English, Urdu, Roman Urdu, or a mix) and return ONLY a JSON object — no prose, no markdown — with exactly these fields:

{
  "type": one of "all" | "House" | "Apartment" | "Villa" | "Plot" | "Commercial" | "Penthouse" | "Office" | "Shop",
  "beds": one of "all" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10+",
  "baths": one of "all" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10+",
  "category": one of "all" | "For Sale" | "For Rent",
  "budget": one of "all" | "Budget" | "Premium" | "Luxury",
  "minPrice": a raw PKR number as a string (e.g. "5000000"), or "" if not mentioned,
  "maxPrice": a raw PKR number as a string (e.g. "20000000"), or "" if not mentioned,
  "keywords": short free text for anything left over — city, area/neighbourhood name, or other distinguishing words (e.g. "DHA Karachi"). "" if nothing extra.,
  "reply": a short, warm, one-sentence reply (max ~20 words) confirming what you understood, written in the SAME language/style the user used (Roman Urdu in, Roman Urdu out; English in, English out)
}

Rules for prices: "crore" = *10,000,000. "lakh"/"lac" = *100,000. "million" = *1,000,000. "k"/"thousand" = *1,000.
"under/below/max/less than X" -> maxPrice. "above/over/min/more than X" -> minPrice.
If budget tier isn't explicitly stated but price range strongly implies one, you may infer it, otherwise leave "all".
Never invent details the user didn't say or imply. Output must be valid JSON matching the schema above, nothing else.`;

/**
 * NestFinder AI — Cloud Function: aiRecommendations  [OPTIONAL / NOT REQUIRED]
 * ---------------------------------------------------------------
 * NOTE: The AI Recommendations page now calls a free AI provider (Groq)
 * directly from the browser (see AI_PROVIDER_* constants in
 * area-insight.js), so this function is NOT required and does NOT need
 * to be deployed. It's kept here only as an optional upgrade path for
 * later, if you ever want the AI key hidden server-side instead of in
 * browser code (that requires Firebase's paid Blaze plan, which is why
 * it's optional rather than the default).
 * ---------------------------------------------------------------
 * Receives the same analyze/compare requests area-insight.js can send,
 * and forwards them to OpenAI server-side.
 * ---------------------------------------------------------------
 */

const ANALYZE_SYSTEM_PROMPT = `You are the recommendation engine for NestFinder AI, a Pakistani real-estate platform.
You will receive JSON with:
- "prefs": the user's stated { purpose, lifestyle, budget }
- "areas": a list of real neighbourhoods with real metrics (safety, affordability, connectivity, growth, amenities, greenery — all 0-100), price data, and YoY growth
- "properties": a list of real property listings (id, title, area, price, beds, baths, size, type, features)

Using ONLY the data provided (never invent areas or properties that aren't in the input), produce a JSON object with exactly these fields and nothing else:

{
  "areaMatches": [ { "id": "<area id from input>", "matchScore": <0-100 integer reflecting how well this area fits the stated prefs, based on its actual metrics>, "reason": "<1-2 sentence explanation citing the area's real numbers, tailored to the prefs>" }, ... one entry per area given ],
  "propertyScores": [ { "id": "<property id from input>", "aiScore": <0-100 integer>, "aiReason": "<one confident sentence explaining why this specific property suits the prefs, referencing its real price/beds/area/type>" }, ... one entry per property given ],
  "tips": [ { "icon": "<one bootstrap-icons class from this list: bi-graph-up-arrow, bi-shield-check, bi-cash-stack, bi-bus-front, bi-building-up, bi-pie-chart, bi-heart-pulse, bi-tree, bi-stars, bi-clock-history, bi-lightbulb, bi-house-heart>", "type": "<short lowercase category word>", "text": "<one actionable, specific tip (max ~28 words) grounded in the actual area data provided and tailored to the user's prefs>" }, ... exactly 4 tips ],
  "marketCommentary": "<2-3 sentence market summary synthesised from the real YoY growth figures and zone data given, written for a Pakistani property buyer/renter>"
}

Be analytical and specific — reference real numbers (e.g. "92/100 safety", "+18.3% YoY") rather than generic praise. Vary scores realistically; do not give everything a high score. Output valid JSON only, no markdown, no prose outside the JSON object.`;

const COMPARE_SYSTEM_PROMPT = `You are the analysis writer for NestFinder AI's area-comparison tool.
You will receive JSON with two real areas (areaA, areaB), the user's prefs, the already-computed per-metric winners ("factors"), and the total composite scores.
Write a JSON object with exactly one field:

{ "explanation": "<2-3 sentence natural-language explanation of why the overall winner won, referencing at least two specific real metrics/numbers from the factors given, tailored to the user's stated prefs>" }

Do not invent numbers not present in the input. Output valid JSON only, no markdown.`;

async function callOpenAI(apiKey, systemPrompt, userPayload) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI error: ${errText}`);
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

exports.aiRecommendations = onRequest(
  { secrets: [OPENAI_API_KEY], cors: true, region: "us-central1", timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST" });
      return;
    }

    const body = req.body || {};
    const action = body.action || "analyze";

    try {
      if (action === "analyze") {
        const prefs = body.prefs || {};
        const areas = Array.isArray(body.areas) ? body.areas : [];
        const properties = Array.isArray(body.properties) ? body.properties : [];

        if (areas.length === 0) {
          res.status(400).json({ error: "Missing 'areas' in request body" });
          return;
        }

        const result = await callOpenAI(OPENAI_API_KEY.value(), ANALYZE_SYSTEM_PROMPT, { prefs, areas, properties });

        const safe = {
          areaMatches: Array.isArray(result.areaMatches) ? result.areaMatches : [],
          propertyScores: Array.isArray(result.propertyScores) ? result.propertyScores : [],
          tips: Array.isArray(result.tips) ? result.tips.slice(0, 4) : [],
          marketCommentary: result.marketCommentary || "",
        };
        res.status(200).json(safe);
        return;
      }

      if (action === "compare") {
        const { areaA, areaB, prefs, factors, totalScoreA, totalScoreB, winnerName } = body;
        if (!areaA || !areaB || !factors) {
          res.status(400).json({ error: "Missing area/comparison data in request body" });
          return;
        }
        const result = await callOpenAI(OPENAI_API_KEY.value(), COMPARE_SYSTEM_PROMPT, {
          areaA, areaB, prefs, factors, totalScoreA, totalScoreB, winnerName,
        });
        res.status(200).json({ explanation: result.explanation || "" });
        return;
      }

      res.status(400).json({ error: `Unknown action '${action}'` });
    } catch (err) {
      logger.error("aiRecommendations failed", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

exports.aiPropertySearch = onRequest(
  { secrets: [OPENAI_API_KEY], cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST" });
      return;
    }

    const query = (req.body && req.body.query || "").toString().trim();
    if (!query) {
      res.status(400).json({ error: "Missing 'query' in request body" });
      return;
    }

    try {
      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY.value()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query },
          ],
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        logger.error("OpenAI error", errText);
        res.status(502).json({ error: "AI provider error" });
        return;
      }

      const data = await openaiResp.json();
      const raw = data.choices?.[0]?.message?.content || "{}";

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        logger.error("Failed to parse model JSON", raw);
        res.status(502).json({ error: "AI returned invalid JSON" });
        return;
      }

      // Defensive defaults in case the model omits a field.
      const safe = {
        type: parsed.type || "all",
        beds: parsed.beds || "all",
        baths: parsed.baths || "all",
        category: parsed.category || "all",
        budget: parsed.budget || "all",
        minPrice: parsed.minPrice || "",
        maxPrice: parsed.maxPrice || "",
        keywords: parsed.keywords || "",
        reply: parsed.reply || "Here's what I found for you.",
      };

      res.status(200).json(safe);
    } catch (err) {
      logger.error("aiPropertySearch failed", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/**
 * NestFinder AI — Cloud Function: zenserpSearch
 * ---------------------------------------------------------------
 * Receives structured search params from the AI Property Advisor,
 * builds an optimized Google search query targeting trusted real
 * estate websites, and calls the Zenserp SERP API server-side so
 * the API key is never exposed to the browser.
 *
 * ONE-TIME SETUP:
 *   1. firebase functions:secrets:set ZENSERP_API_KEY
 *        -> paste your Zenserp API key when prompted
 *   2. firebase deploy --only functions
 *
 * Deploy will print a URL like:
 *   https://zenserpsearch-xxxxxxxxxx-uc.a.run.app
 * Copy that URL into ZENSERP_FUNCTION_URL in ai-config.js.
 * ---------------------------------------------------------------
 */

const SEARCH_SITES = ["zameen.com", "graana.com", "agency21.com", "lamudi.pk"];

function buildWebQuery(params) {
  var parts = [];
  var siteFilter = SEARCH_SITES.map(function (s) { return "site:" + s; }).join(" OR ");

  if (params.type && params.type !== "all" && params.type !== "") parts.push('"' + params.type + '"');
  if (params.bedrooms > 0) parts.push(params.bedrooms + " bedroom");
  if (params.area) parts.push('"' + params.area + '"');
  if (params.city) parts.push('"' + params.city + '"');
  if (params.maxPrice > 0) {
    parts.push('"' + formatPrice(params.maxPrice) + '"');
  }
  if (params.minPrice > 0) {
    parts.push('"' + formatPrice(params.minPrice) + '"');
  }
  if (params.bathrooms > 0) parts.push(params.bathrooms + " bathroom");
  if (parts.length === 0) parts.push("property for sale");

  return siteFilter + " " + parts.join(" ");
}

function formatPrice(n) {
  if (!n) return "";
  if (n >= 10000000) return (n / 10000000).toFixed(1) + " Crore";
  if (n >= 100000) return (n / 100000).toFixed(1) + " Lakh";
  return n.toLocaleString();
}

exports.zenserpSearch = onRequest(
  { secrets: [ZENSERP_SECRET], cors: true, region: "us-central1", timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST" });
      return;
    }

    const params = req.body.params || {};
    const userQuery = (req.body.query || "").toString().trim();

    if (!params && !userQuery) {
      res.status(400).json({ error: "Missing search parameters" });
      return;
    }

    try {
      var searchQuery = buildWebQuery(params);
      logger.info("Zenserp search query: " + searchQuery);

      var zenserpUrl = "https://app.zenserp.com/api/v2/search?q=" +
        encodeURIComponent(searchQuery) +
        "&apikey=" + ZENSERP_SECRET.value() +
        "&num=6";

      var response = await fetch(zenserpUrl);
      if (!response.ok) {
        var errText = await response.text();
        logger.error("Zenserp API error", response.status, errText);
        res.status(502).json({ error: "External search provider error", results: [] });
        return;
      }

      var data = await response.json();

      if (!data || !Array.isArray(data.organic)) {
        res.status(200).json({ results: [] });
        return;
      }

      var results = data.organic.slice(0, 6).map(function (r) {
        var rawUrl = r.url || r.destination || "";
        var hostname = "";
        try { hostname = new URL(rawUrl).hostname; } catch (e) { hostname = ""; }
        return {
          title: r.title || "",
          url: rawUrl,
          source: hostname,
          description: r.description || r.snippet || ""
        };
      });

      res.status(200).json({ results: results });
    } catch (err) {
      logger.error("zenserpSearch failed", err);
      res.status(500).json({ error: "Internal error", results: [] });
    }
  }
);
