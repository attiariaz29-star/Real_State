/**
 * NESTFINDER AI - AREA INTELLIGENCE ENGINE
 * Zillow-style analytics: scoring, comparison, personalization, heatmaps
 */

// ============================================
// AREA DATABASE (Structured AI-Ready Data)
// ============================================
const AREA_DATABASE = [
  {
    id: "dha6",
    name: "DHA Phase 6",
    city: "Karachi",
    coords: { lat: 24.806, lng: 67.065 },
    zone: "high",
    rentAvg: 120000,
    buyAvg: 75000000,
    metrics: { safety: 92, affordability: 35, connectivity: 78, growth: 72, amenities: 90, greenery: 65 },
    lifestyle: ["premium", "family", "expat"],
    properties: 148,
    trending: true,
    description: "Established defense housing authority with top-tier security, schools, and commercial hubs.",
    priceYoY: +8.4,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
  },
  {
    id: "clifton",
    name: "Clifton",
    city: "Karachi",
    coords: { lat: 24.812, lng: 67.032 },
    zone: "high",
    rentAvg: 145000,
    buyAvg: 95000000,
    metrics: { safety: 88, affordability: 28, connectivity: 85, growth: 65, amenities: 95, greenery: 55 },
    lifestyle: ["premium", "expat", "luxury"],
    properties: 203,
    trending: false,
    description: "Sea-facing elite locality with embassies, five-star hotels, and Pakistan's premium commercial strip.",
    priceYoY: +5.2,
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80"
  },
  {
    id: "gulshan",
    name: "Gulshan-e-Iqbal",
    city: "Karachi",
    coords: { lat: 24.928, lng: 67.093 },
    zone: "mid",
    rentAvg: 38000,
    buyAvg: 18000000,
    metrics: { safety: 72, affordability: 72, connectivity: 80, growth: 68, amenities: 75, greenery: 58 },
    lifestyle: ["budget", "family", "student"],
    properties: 412,
    trending: true,
    description: "Central Karachi's most populated hub with universities, hospitals, and dense commercial activity.",
    priceYoY: +12.1,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80"
  },
  {
    id: "pechs",
    name: "PECHS",
    city: "Karachi",
    coords: { lat: 24.869, lng: 67.053 },
    zone: "mid",
    rentAvg: 55000,
    buyAvg: 28000000,
    metrics: { safety: 78, affordability: 58, connectivity: 82, growth: 70, amenities: 80, greenery: 50 },
    lifestyle: ["family", "professional", "budget"],
    properties: 287,
    trending: false,
    description: "Pakistan Employees Cooperative Society — well-planned residential blocks with good access to offices.",
    priceYoY: +9.5,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6b3?w=800&q=80"
  },
  {
    id: "bahria_khi",
    name: "Bahria Town Karachi",
    city: "Karachi",
    coords: { lat: 24.87, lng: 66.99 },
    zone: "mid",
    rentAvg: 70000,
    buyAvg: 32000000,
    metrics: { safety: 90, affordability: 52, connectivity: 60, growth: 85, amenities: 88, greenery: 75 },
    lifestyle: ["family", "investment", "premium"],
    properties: 534,
    trending: true,
    description: "Gated mega-township with schools, hospitals, golf course, and rapid infrastructure growth.",
    priceYoY: +18.3,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
  },
  {
    id: "dha_lhr",
    name: "DHA Lahore",
    city: "Lahore",
    coords: { lat: 31.48, lng: 74.37 },
    zone: "high",
    rentAvg: 95000,
    buyAvg: 55000000,
    metrics: { safety: 91, affordability: 40, connectivity: 72, growth: 78, amenities: 88, greenery: 70 },
    lifestyle: ["premium", "family", "investment"],
    properties: 891,
    trending: true,
    description: "Lahore's premier planned community spanning multiple phases with top schools and commercial blocks.",
    priceYoY: +14.2,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"
  },
  {
    id: "gulberg",
    name: "Gulberg III",
    city: "Lahore",
    coords: { lat: 31.511, lng: 74.343 },
    zone: "high",
    rentAvg: 110000,
    buyAvg: 65000000,
    metrics: { safety: 82, affordability: 32, connectivity: 90, growth: 68, amenities: 92, greenery: 45 },
    lifestyle: ["premium", "professional", "expat"],
    properties: 312,
    trending: false,
    description: "Lahore's commercial and diplomatic hub with Main Boulevard, five-star hotels, and corporate offices.",
    priceYoY: +6.1,
    image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800&q=80"
  },
  {
    id: "johar",
    name: "Johar Town",
    city: "Lahore",
    coords: { lat: 31.466, lng: 74.278 },
    zone: "mid",
    rentAvg: 45000,
    buyAvg: 22000000,
    metrics: { safety: 75, affordability: 68, connectivity: 78, growth: 72, amenities: 72, greenery: 60 },
    lifestyle: ["family", "student", "budget"],
    properties: 645,
    trending: true,
    description: "Affordable family-oriented neighborhood near Lahore Ring Road with good university access.",
    priceYoY: +11.8,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"
  },
  {
    id: "f10",
    name: "F-10 Sector",
    city: "Islamabad",
    coords: { lat: 33.706, lng: 73.042 },
    zone: "high",
    rentAvg: 125000,
    buyAvg: 80000000,
    metrics: { safety: 95, affordability: 30, connectivity: 85, growth: 60, amenities: 90, greenery: 85 },
    lifestyle: ["premium", "expat", "family"],
    properties: 178,
    trending: false,
    description: "CDA-developed premium Islamabad sector with embassies, wide roads, and a tree-lined environment.",
    priceYoY: +7.4,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
  },
  {
    id: "bahria_isb",
    name: "Bahria Town Islamabad",
    city: "Islamabad",
    coords: { lat: 33.508, lng: 73.205 },
    zone: "mid",
    rentAvg: 65000,
    buyAvg: 30000000,
    metrics: { safety: 93, affordability: 55, connectivity: 65, growth: 88, amenities: 85, greenery: 80 },
    lifestyle: ["family", "investment", "premium"],
    properties: 723,
    trending: true,
    description: "Self-contained satellite city near Islamabad with grand mosque, international schools, and facilities.",
    priceYoY: +21.5,
    image: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80"
  }
];

// ============================================
// AI PROPERTY RECOMMENDATIONS DATABASE
// ============================================
const AI_PROPERTIES = [

  // ── BUDGET TIER ──────────────────────────────────────────────────────────────
  {
    id: "ai6",  budget: "budget",
    title: "2-Bed Flat, Gulshan-e-Iqbal Blk 13", area: "gulshan",
    price: 38000, priceDisplay: "PKR 38K/mo",
    purpose: "Rent", type: "Apartment", beds: 2, baths: 2, size: "1100 sq ft",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    aiScore: 85, aiReason: "Highest affordability score in Karachi — university access, UPS backup, lift",
    features: ["Near University", "UPS Backup", "Elevator"], tags: ["Budget Friendly", "Trending"]
  },
  {
    id: "ai7",  budget: "budget",
    title: "Studio Apt for Rent, Johar Town", area: "johar",
    price: 22000, priceDisplay: "PKR 22K/mo",
    purpose: "Rent", type: "Studio", beds: 1, baths: 1, size: "550 sq ft",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    aiScore: 78, aiReason: "Most affordable option near Lahore Ring Road — ideal for students & singles",
    features: ["Metered Electricity", "Near Ring Road", "Furnished Option"], tags: ["Budget Friendly", "Popular"]
  },
  {
    id: "ai8",  budget: "budget",
    title: "3-Bed House for Rent, PECHS Blk 2", area: "pechs",
    price: 45000, priceDisplay: "PKR 45K/mo",
    purpose: "Rent", type: "House", beds: 3, baths: 2, size: "180 sq yards",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    aiScore: 80, aiReason: "Best value family rental in central Karachi — schools and markets within 1 km",
    features: ["Servant Quarter", "Gas Connection", "Near School"], tags: ["Budget Friendly", "High Growth"]
  },
  {
    id: "ai9",  budget: "budget",
    title: "2-Bed Apartment to Buy, Gulshan", area: "gulshan",
    price: 6500000, priceDisplay: "PKR 65 Lakh",
    purpose: "Buy", type: "Apartment", beds: 2, baths: 2, size: "950 sq ft",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    aiScore: 82, aiReason: "Most affordable ownership option with 12.1% YoY growth in the area",
    features: ["Registered Title", "Elevator", "Tiled Floors"], tags: ["Budget Friendly", "Best Value"]
  },

  // ── MID-RANGE TIER ───────────────────────────────────────────────────────────
  {
    id: "ai3",  budget: "mid",
    title: "Family Home, Bahria Town Karachi", area: "bahria_khi",
    price: 32000000, priceDisplay: "PKR 3.2 Crore",
    purpose: "Buy", type: "House", beds: 5, baths: 4, size: "400 sq yards",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    aiScore: 94, aiReason: "Highest growth potential (+18.3% YoY) in gated community with school & park access",
    features: ["Gated", "School Nearby", "Park View"], tags: ["Best Value", "High Growth"]
  },
  {
    id: "ai4",  budget: "mid",
    title: "Executive Apartment, DHA Lahore Ph 5", area: "dha_lhr",
    price: 120000, priceDisplay: "PKR 1.2L/mo",
    purpose: "Rent", type: "Apartment", beds: 3, baths: 3, size: "2200 sq ft",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    aiScore: 89, aiReason: "Best rent-to-quality ratio in Lahore with strong connectivity and backup power",
    features: ["Rooftop Terrace", "Parking", "Backup Power"], tags: ["Investment", "Popular"]
  },
  {
    id: "ai5",  budget: "mid",
    title: "Bahria Islamabad Smart Home Ph 4", area: "bahria_isb",
    price: 30000000, priceDisplay: "PKR 3.0 Crore",
    purpose: "Buy", type: "House", beds: 4, baths: 4, size: "350 sq yards",
    image: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80",
    aiScore: 97, aiReason: "Fastest-growing zone (+21.5% YoY) — most affordable gated community near Islamabad",
    features: ["Smart Locks", "Solar Panels", "Green Belt"], tags: ["AI Top Pick", "Fastest Growing"]
  },
  {
    id: "ai10", budget: "mid",
    title: "3-Bed Townhouse, Gulberg III Lahore", area: "gulberg",
    price: 85000, priceDisplay: "PKR 85K/mo",
    purpose: "Rent", type: "Townhouse", beds: 3, baths: 3, size: "280 sq yards",
    image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f93?w=800&q=80",
    aiScore: 87, aiReason: "Commercial hub access + highest amenity score in Lahore for mid-range segment",
    features: ["Corporate Office Nearby", "Marble Floors", "Guard"], tags: ["Trending", "Popular"]
  },

  // ── PREMIUM TIER ─────────────────────────────────────────────────────────────
  {
    id: "ai1",  budget: "premium",
    title: "Modern Villa in DHA Phase 6 Karachi", area: "dha6",
    price: 85000000, priceDisplay: "PKR 8.5 Crore",
    purpose: "Buy", type: "Villa", beds: 4, baths: 5, size: "500 sq yards",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    aiScore: 96, aiReason: "Top safety rating + superior ROI + proximity to international schools and hospitals",
    features: ["Swimming Pool", "Smart Home", "Solar Panels"], tags: ["Hot Deal", "AI Top Pick"]
  },
  {
    id: "ai2",  budget: "premium",
    title: "Luxury Sea-View Penthouse, Clifton Blk 5", area: "clifton",
    price: 95000000, priceDisplay: "PKR 9.5 Crore",
    purpose: "Buy", type: "Penthouse", beds: 4, baths: 5, size: "3500 sq ft",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
    aiScore: 91, aiReason: "Premium sea-view location with maximum amenity score — Karachi's most iconic address",
    features: ["Sea View", "Gym", "24/7 Security"], tags: ["Premium", "Trending"]
  },
  {
    id: "ai11", budget: "premium",
    title: "Diplomatic Enclave Home, F-10 Islamabad", area: "f10",
    price: 80000000, priceDisplay: "PKR 8.0 Crore",
    purpose: "Buy", type: "House", beds: 5, baths: 6, size: "1000 sq yards",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    aiScore: 93, aiReason: "Islamabad's safest sector (95/100) — embassy row, tree-lined boulevards, elite schools",
    features: ["Embassy Row", "Basement", "Manicured Garden"], tags: ["Premium", "AI Top Pick"]
  },
  {
    id: "ai12", budget: "premium",
    title: "Luxury Penthouse Rent, Gulberg III Lahore", area: "gulberg",
    price: 350000, priceDisplay: "PKR 3.5L/mo",
    purpose: "Rent", type: "Penthouse", beds: 4, baths: 4, size: "4000 sq ft",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    aiScore: 90, aiReason: "Lahore's top commercial address — highest connectivity score, corporate district access",
    features: ["City View", "Private Lift", "Concierge"], tags: ["Premium", "Hot Deal"]
  }
];

// ============================================
// MARKET INSIGHTS DATA
// ============================================
const MARKET_INSIGHTS = {
  nationalIndex: 112.4,
  nationalChange: +14.2,
  rentalYield: 4.8,
  yieldChange: +0.3,
  daysOnMarket: 38,
  daysChange: -12,
  demandIndex: 87,
  hotCities: ["Bahria Town Islamabad", "Bahria Town Karachi", "DHA Lahore"],
  trendingAreas: ["bahria_isb", "bahria_khi", "gulshan", "dha_lhr"],
  priceOutlook: "bullish",
  quarterlyReport: "Q2 2026 shows 14.2% YoY price appreciation nationally. Gated communities outperform by 2.3x. Islamabad corridor projects highest 5-year IRR at 22.4%."
};

// ============================================
// REAL AI CONFIG — FREE, NO PAID PLAN NEEDED
// ============================================
// Calls Groq's free AI API directly from the browser — no Firebase Cloud
// Functions, no Blaze billing plan required. Groq's free tier needs no
// credit card; if you ever exceed the free quota it just pauses (returns
// an error) instead of charging anything.
//
// ONE-TIME SETUP (2 minutes, totally free):
//   1. Go to https://console.groq.com/keys
//   2. Sign up (Google/GitHub login is fine) — no card needed
//   3. Click "Create API Key", copy it
//   4. Paste it below, replacing "PASTE_YOUR_FREE_GROQ_API_KEY_HERE"
//
// NOTE: because this key lives in browser code, anyone who views your
// page's source can see it. That's an acceptable trade-off for a free
// personal/student project — worst case someone else uses up your free
// quota, you are never charged money. If you later want the key fully
// hidden, that needs a small server (e.g. Firebase Functions on the paid
// Blaze plan, or a free alternative like a Cloudflare Worker/Vercel
// function) to proxy the request — not required for this to work today.
const AI_PROVIDER_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const AI_PROVIDER_MODEL = "llama-3.3-70b-versatile";
const AI_PROVIDER_API_KEY = "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";

const ANALYZE_SYSTEM_PROMPT = `You are the recommendation engine for NestFinder AI, a Pakistani real-estate platform.
You will receive JSON with:
- "prefs": the user's stated { purpose, lifestyle, budget }
- "areas": a list of real neighbourhoods with real metrics (safety, affordability, connectivity, growth, amenities, greenery — all 0-100), price data, and YoY growth
- "properties": a list of real property listings (id, title, area, price, beds, baths, size, type, features)

Using ONLY the data provided (never invent areas or properties that aren't in the input), respond with ONLY a raw JSON object — no markdown, no code fences, no prose — with exactly these fields:

{
  "areaMatches": [ { "id": "<area id from input>", "matchScore": <0-100 integer reflecting how well this area fits the stated prefs, based on its actual metrics>, "reason": "<1-2 sentence explanation citing the area's real numbers, tailored to the prefs>" }, ... one entry per area given ],
  "propertyScores": [ { "id": "<property id from input>", "aiScore": <0-100 integer>, "aiReason": "<one confident sentence explaining why this specific property suits the prefs, referencing its real price/beds/area/type>" }, ... one entry per property given ],
  "tips": [ { "icon": "<one bootstrap-icons class from this list: bi-graph-up-arrow, bi-shield-check, bi-cash-stack, bi-bus-front, bi-building-up, bi-pie-chart, bi-heart-pulse, bi-tree, bi-stars, bi-clock-history, bi-lightbulb, bi-house-heart>", "type": "<short lowercase category word>", "text": "<one actionable, specific tip (max ~28 words) grounded in the actual area data provided and tailored to the user's prefs>" }, ... exactly 4 tips ],
  "marketCommentary": "<2-3 sentence market summary synthesised from the real YoY growth figures and zone data given, written for a Pakistani property buyer/renter>"
}

Be analytical and specific — reference real numbers (e.g. "92/100 safety", "+18.3% YoY") rather than generic praise. Vary scores realistically; do not give everything a high score.`;

const COMPARE_SYSTEM_PROMPT = `You are the analysis writer for NestFinder AI's area-comparison tool.
You will receive JSON with two real areas (areaA, areaB), the user's prefs, the already-computed per-metric winners ("factors"), and the total composite scores.
Respond with ONLY a raw JSON object — no markdown, no code fences — with exactly one field:

{ "explanation": "<2-3 sentence natural-language explanation of why the overall winner won, referencing at least two specific real metrics/numbers from the factors given, tailored to the user's stated prefs>" }

Do not invent numbers not present in the input.`;

async function callAIModel(systemPrompt, userPayload) {
  if (!AI_PROVIDER_API_KEY || AI_PROVIDER_API_KEY.startsWith("PASTE_")) {
    throw new Error("AI API key not set yet — open area-insight.js and paste your free Groq key (see AI_SETUP_README.md).");
  }
  const resp = await fetch(AI_PROVIDER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_PROVIDER_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_PROVIDER_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`AI provider error (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

// ============================================
// AI SCORING ENGINE
// ============================================
const AIEngine = {

  // Weighted metric scoring
  WEIGHTS: {
    purpose_buy:   { safety: 0.20, affordability: 0.25, growth: 0.30, connectivity: 0.10, amenities: 0.10, greenery: 0.05 },
    purpose_rent:  { safety: 0.15, affordability: 0.35, connectivity: 0.25, amenities: 0.15, growth: 0.05, greenery: 0.05 },
    lifestyle_family:     { safety: 0.30, amenities: 0.25, greenery: 0.15, affordability: 0.20, connectivity: 0.05, growth: 0.05 },
    lifestyle_investment: { growth: 0.45, affordability: 0.20, connectivity: 0.15, safety: 0.10, amenities: 0.05, greenery: 0.05 },
    lifestyle_premium:    { safety: 0.20, amenities: 0.30, connectivity: 0.20, growth: 0.15, affordability: 0.10, greenery: 0.05 },
    lifestyle_student:    { affordability: 0.40, connectivity: 0.30, amenities: 0.15, safety: 0.10, growth: 0.03, greenery: 0.02 },
  },

  // ---- Offline fallback estimate (used ONLY if the real AI backend call
  // fails, e.g. no network / function not yet deployed) — kept so the page
  // never goes blank, but every normal page load/run uses the real AI
  // methods below (analyze / compareWithAI) instead of this formula. ----
  scoreAreaFallback(area, prefs) {
    const weightKey = prefs.lifestyle ? `lifestyle_${prefs.lifestyle}` : `purpose_${prefs.purpose || 'buy'}`;
    const weights = this.WEIGHTS[weightKey] || this.WEIGHTS.purpose_buy;

    let score = 0;
    for (const [metric, weight] of Object.entries(weights)) {
      score += (area.metrics[metric] || 0) * weight;
    }

    // Budget match bonus
    if (prefs.budget === "budget" && area.zone === "low") score += 5;
    if (prefs.budget === "premium" && area.zone === "high") score += 5;

    // Growth bonus
    if (area.priceYoY > 15) score += 3;

    return Math.min(Math.round(score), 100);
  },

  // Offline fallback reasoning text (see note above)
  generateReasonFallback(area, prefs, score) {
    const lines = [];
    const m = area.metrics;

    if (score >= 90) lines.push(`Outstanding match for your ${prefs.lifestyle || prefs.purpose} profile.`);
    else if (score >= 75) lines.push(`Strong fit with your preferences.`);
    else lines.push(`Moderate alignment with your criteria.`);

    if (m.safety >= 85) lines.push(`✅ Excellent safety (${m.safety}/100)`);
    if (m.affordability >= 70) lines.push(`✅ High affordability (${m.affordability}/100)`);
    if (m.growth >= 80) lines.push(`📈 Strong growth outlook (+${area.priceYoY}% YoY)`);
    if (m.connectivity >= 80) lines.push(`🚇 Great connectivity (${m.connectivity}/100)`);
    if (area.priceYoY > 15) lines.push(`🔥 Among fastest-growing zones nationally`);

    return lines.join(' · ');
  },

  // Offline fallback matching (see note above)
  matchAreasFallback(prefs) {
    return AREA_DATABASE
      .map(area => ({
        ...area,
        matchScore: this.scoreAreaFallback(area, prefs),
        reason: this.generateReasonFallback(area, prefs, this.scoreAreaFallback(area, prefs))
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  },

  // ─── REAL AI: full analysis (area matches + property scores + tips +
  // market commentary) in one call to the aiRecommendations Cloud Function,
  // which sends the real data to OpenAI and returns real, freshly-generated
  // text/scores — nothing here is precomputed or canned. ───────────────────
  async analyze(prefs, areas, properties) {
    // Trim payloads to just what the model needs (keeps requests small/fast).
    const areaPayload = areas.map(a => ({
      id: a.id, name: a.name, city: a.city, zone: a.zone,
      metrics: a.metrics, priceYoY: a.priceYoY, rentAvg: a.rentAvg,
      buyAvg: a.buyAvg, properties: a.properties, lifestyle: a.lifestyle,
      trending: a.trending, description: a.description
    }));
    const propPayload = properties.slice(0, 40).map(p => ({
      id: p.id, title: p.title, areaName: p.areaName || (AREA_DATABASE.find(a => a.id === p.area) || {}).name,
      price: p.price, purpose: p.purpose, type: p.type, beds: p.beds,
      baths: p.baths, size: p.size, features: p.features, budget: p.budget
    }));

    const result = await callAIModel(ANALYZE_SYSTEM_PROMPT, { prefs, areas: areaPayload, properties: propPayload });

    const areaMatchMap = new Map((result.areaMatches || []).map(m => [String(m.id), m]));
    const propertyScoreMap = new Map((result.propertyScores || []).map(s => [String(s.id), s]));

    return {
      areaMatches: areaMatchMap,
      propertyScores: propertyScoreMap,
      tips: (result.tips || []).slice(0, 4),
      marketCommentary: result.marketCommentary || ""
    };
  },

  // Compare two areas side-by-side — the per-metric numbers and win-counts
  // are real, direct comparisons of the real metric data (deterministic
  // math, not "AI"), but the explanation paragraph is written by the real
  // AI backend so it isn't a canned template string.
  async compareWithAI(idA, idB, prefs = {}) {
    const a = AREA_DATABASE.find(x => x.id === idA);
    const b = AREA_DATABASE.find(x => x.id === idB);
    if (!a || !b) return null;

    const weights = this.WEIGHTS[`lifestyle_${prefs.lifestyle}`] || this.WEIGHTS.purpose_buy;
    const factors = {};
    let winA = 0, winB = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      const scoreA = a.metrics[metric];
      const scoreB = b.metrics[metric];
      const winner = scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'tie';
      factors[metric] = { scoreA, scoreB, winner, weight, label: metric.charAt(0).toUpperCase() + metric.slice(1) };
      if (winner === 'a') winA++;
      else if (winner === 'b') winB++;
    }

    const totalScoreA = this.scoreAreaFallback(a, prefs);
    const totalScoreB = this.scoreAreaFallback(b, prefs);
    const overallWinner = totalScoreA >= totalScoreB ? a : b;

    let explanation;
    try {
      const aiResult = await callAIModel(COMPARE_SYSTEM_PROMPT, {
        areaA: { id: a.id, name: a.name, city: a.city, metrics: a.metrics, priceYoY: a.priceYoY },
        areaB: { id: b.id, name: b.name, city: b.city, metrics: b.metrics, priceYoY: b.priceYoY },
        prefs, factors, totalScoreA, totalScoreB, winnerName: overallWinner.name
      });
      explanation = aiResult.explanation;
    } catch (err) {
      console.error("AI compare explanation failed, using fallback text:", err);
      explanation = `${overallWinner.name} wins with a composite score of ${Math.max(totalScoreA, totalScoreB)}. It outperforms on ${overallWinner === a ? winA : winB} of ${Object.keys(factors).length} key metrics. (AI explanation unavailable — showing baseline summary.)`;
    }

    return { a, b, factors, winA, winB, totalScoreA, totalScoreB, overallWinner, explanation };
  },

  // Heatmap zones for pricing
  getPriceZones() {
    return AREA_DATABASE.map(area => ({
      id: area.id, name: area.name, city: area.city,
      coords: area.coords, zone: area.zone,
      intensity: area.zone === 'high' ? 0.9 : area.zone === 'mid' ? 0.55 : 0.25,
      rentAvg: area.rentAvg, buyAvg: area.buyAvg,
      color: area.zone === 'high' ? '#ef4444' : area.zone === 'mid' ? '#f59e0b' : '#10b981'
    }));
  },

  // Offline fallback tips (see note above) — real tips come from analyze()
  getPersonalizedTipsFallback(prefs) {
    const tips = [];
    if (prefs.purpose === 'buy') {
      tips.push({ icon: 'bi-graph-up-arrow', text: `Areas with >15% YoY growth deliver the best 5-year ROI. Bahria projects are current leaders.`, type: 'growth' });
      tips.push({ icon: 'bi-shield-check', text: `Gated communities in Pakistan command 22% price premium but deliver 2.1x better safety scores.`, type: 'safety' });
    }
    if (prefs.purpose === 'rent') {
      tips.push({ icon: 'bi-cash-stack', text: `Gulshan and Johar Town offer the best rent-to-amenity ratios in their respective cities.`, type: 'value' });
      tips.push({ icon: 'bi-bus-front', text: `Connectivity score above 75 reduces commute time by an average of 35 minutes daily.`, type: 'connectivity' });
    }
    if (prefs.lifestyle === 'investment') {
      tips.push({ icon: 'bi-building-up', text: `Bahria Town Islamabad has outperformed the national real estate index by 7.3% over 3 years.`, type: 'investment' });
      tips.push({ icon: 'bi-pie-chart', text: `Diversify across 2 cities — Karachi + Islamabad — to hedge regional market risk.`, type: 'strategy' });
    }
    if (prefs.lifestyle === 'family') {
      tips.push({ icon: 'bi-heart-pulse', text: `Areas near Aga Khan or Shifa hospitals significantly improve your family health-access score.`, type: 'health' });
      tips.push({ icon: 'bi-tree', text: `Greenery index above 70 correlates with 15% better mental health outcomes and school ratings.`, type: 'wellness' });
    }
    // Default tips
    tips.push({ icon: 'bi-stars', text: `AI Match scores above 85% indicate a very strong alignment with your lifestyle requirements.`, type: 'ai' });
    tips.push({ icon: 'bi-clock-history', text: `The optimal buy window is typically Q1–Q2. Prices historically rise 8–12% in Q3 and Q4.`, type: 'timing' });
    return tips.slice(0, 4);
  }
};

// ============================================
// EXPORT FOR GLOBAL ACCESS
// ============================================
window.NestFinderAI = { AIEngine, AREA_DATABASE, AI_PROPERTIES, MARKET_INSIGHTS };
