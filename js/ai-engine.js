const AIEngine = (function() {
  var GROQ_FN_URL = (typeof AI_CONFIG !== "undefined" && AI_CONFIG.GROQ_FUNCTION_URL) ||
    "https://callgroq-xxxxxxxxxx-uc.a.run.app";

  async function callGroq(prompt, systemPrompt, temperature) {
    try {
      var res = await fetch(GROQ_FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          systemPrompt: systemPrompt || "",
          temperature: temperature != null ? temperature : 0.3
        })
      });
      if (!res.ok) throw new Error("Groq proxy error: " + res.status);
      var data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    } catch (e) {
      console.error("AIEngine.callGroq error:", e);
      return null;
    }
  }

  function parseJSON(text) {
    if (!text) return null;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const clean = jsonMatch ? jsonMatch[1].trim() : text.trim();
    try { return JSON.parse(clean); } catch { return null; }
  }

  async function propertySummary(property, areaData) {
    const prompt = `Analyze this property and provide a concise AI summary highlighting strengths, target buyers, and investment potential:

Property: ${property.title || property.propertyName || "N/A"}
Type: ${property.type || property.propertyType || "N/A"}
Price: ${property.price || "N/A"}
Location: ${property.location || "N/A"}
Bedrooms: ${property.bedrooms || "N/A"}
Bathrooms: ${property.bathrooms || "N/A"}
Description: ${property.description || "N/A"}
Area Size: ${property.areaSize || "N/A"}
${areaData ? "Area Data: " + JSON.stringify(areaData) : ""}

Return a concise JSON object:
{
  "summary": "2-3 sentence summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "targetBuyers": "description of ideal buyer profile",
  "investmentPotential": "high/medium/low with brief reason"
}`;
    const result = await callGroq(prompt, "You are a real estate analyst. Return ONLY valid JSON.", 0.2);
    return parseJSON(result) || { summary: "AI summary unavailable.", strengths: [], targetBuyers: "", investmentPotential: "medium" };
  }

  async function investmentScore(property, allProperties, areaData) {
    const avgPrice = allProperties && allProperties.length > 1
      ? allProperties.reduce((s, p) => s + (Number(p.price) || 0), 0) / allProperties.length : 0;
    const prompt = `Calculate an AI Investment Score (0-100) for this property based on:
- Price: ${property.price || "N/A"} (market avg: ${Math.round(avgPrice)})
- Location: ${property.location || "N/A"}
- Type: ${property.type || property.propertyType || "N/A"}
- Bedrooms: ${property.bedrooms || "N/A"}
- Description: ${(property.description || "").substring(0, 200)}
${areaData ? "Area Data: " + JSON.stringify(areaData) : ""}

Return ONLY a JSON object:
{
  "score": <0-100>,
  "breakdown": { "price": <0-25>, "location": <0-25>, "demand": <0-25>, "amenities": <0-25> },
  "label": "Excellent/Good/Average/Poor",
  "reason": "one sentence explanation"
}`;
    const result = await callGroq(prompt, "You are a real estate investment analyst. Return ONLY valid JSON.", 0.2);
    return parseJSON(result) || { score: 50, breakdown: { price: 12, location: 13, demand: 12, amenities: 13 }, label: "Average", reason: "Insufficient data for accurate scoring." };
  }

  async function lifestyleMatch(property) {
    const prompt = `Analyze who this property is best suited for:

Property: ${property.title || property.propertyName || "N/A"}
Type: ${property.type || property.propertyType || "N/A"}
Price: ${property.price || "N/A"}
Location: ${property.location || "N/A"}
Bedrooms: ${property.bedrooms || "N/A"}
Description: ${(property.description || "").substring(0, 300)}

Rate suitability (0-100) for each buyer type with a brief reason. Return ONLY JSON:
{
  "families": { "score": <0-100>, "reason": "..." },
  "students": { "score": <0-100>, "reason": "..." },
  "professionals": { "score": <0-100>, "reason": "..." },
  "investors": { "score": <0-100>, "reason": "..." },
  "retired": { "score": <0-100>, "reason": "..." }
}`;
    const result = await callGroq(prompt, "You are a real estate lifestyle analyst. Return ONLY valid JSON.", 0.2);
    return parseJSON(result) || { families: { score: 50, reason: "" }, students: { score: 50, reason: "" }, professionals: { score: 50, reason: "" }, investors: { score: 50, reason: "" }, retired: { score: 50, reason: "" } };
  }

  async function prosCons(property) {
    const prompt = `Analyze this property and generate pros and cons:

Property: ${property.title || property.propertyName || "N/A"}
Type: ${property.type || property.propertyType || "N/A"}
Price: ${property.price || "N/A"}
Location: ${property.location || "N/A"}
Bedrooms: ${property.bedrooms || "N/A"}
Description: ${(property.description || "").substring(0, 300)}

Return ONLY valid JSON:
{
  "pros": [{ "title": "short title", "description": "one sentence" }],
  "cons": [{ "title": "short title", "description": "one sentence" }]
}
Generate 3-5 items each based on location, amenities, price, type, and investment value. Be specific, not generic.`;
    const result = await callGroq(prompt, "You are a real estate analyst. Return ONLY valid JSON.", 0.3);
    return parseJSON(result) || { pros: [{ title: "Location", description: "Well-positioned property." }], cons: [{ title: "Data Limited", description: "Insufficient data for detailed analysis." }] };
  }

  async function pricePrediction(property) {
    const price = Number(property.price) || 0;
    const prompt = `Predict future property value for:

Location: ${property.location || "N/A"}
Type: ${property.type || property.propertyType || "N/A"}
Current Price: ${price}
Bedrooms: ${property.bedrooms || "N/A"}

Based on typical real estate appreciation for this property type and location, estimate:
- Value after 1 year (5-15% appreciation typical)
- Value after 3 years (15-30% appreciation typical)
- Value after 5 years (25-50% appreciation typical)

Return ONLY valid JSON:
{
  "currentPrice": ${price},
  "predictions": [
    { "year": 1, "price": <number>, "appreciation": "<percentage>%" },
    { "year": 3, "price": <number>, "appreciation": "<percentage>%" },
    { "year": 5, "price": <number>, "appreciation": "<percentage>%" }
  ],
  "cagr": "<number>%",
  "verdict": "one sentence verdict"
}`;
    const result = await callGroq(prompt, "You are a real estate market analyst. Return ONLY valid JSON.", 0.2);
    return parseJSON(result) || {
      currentPrice: price,
      predictions: [
        { year: 1, price: Math.round(price * 1.08), appreciation: "8%" },
        { year: 3, price: Math.round(price * 1.24), appreciation: "24%" },
        { year: 5, price: Math.round(price * 1.40), appreciation: "40%" }
      ],
      cagr: "8%",
      verdict: "Market data insufficient for accurate prediction."
    };
  }

  async function similarProperties(property, allProperties, count = 4) {
    if (!allProperties || allProperties.length < 2) return [];
    const others = allProperties.filter(p =>
      (p.id !== property.id && p.firebaseKey !== property.firebaseKey) &&
      (p.location || "").toLowerCase() !== ""
    );
    if (others.length === 0) return [];
    const prompt = `From the following real estate listings, select the ${count} most similar to the target property based on BUDGET, LOCATION, TYPE, and BEDROOMS.

TARGET PROPERTY:
Title: ${property.title || "N/A"}
Location: ${property.location || "N/A"}
Price: ${property.price || "N/A"}
Type: ${property.type || property.propertyType || "N/A"}
Bedrooms: ${property.bedrooms || "N/A"}

AVAILABLE LISTINGS (JSON array):
${JSON.stringify(others.map(p => ({ id: p.id || p.firebaseKey, title: p.title, location: p.location, price: p.price, type: p.type || p.propertyType, bedrooms: p.bedrooms })))}

Return ONLY a JSON array of the most similar listing IDs (max ${count}):
["id1", "id2", ...]`;
    const result = await callGroq(prompt, "You are a real estate matching specialist. Return ONLY a valid JSON array of IDs.", 0.2);
    const ids = parseJSON(result);
    if (!Array.isArray(ids)) return others.slice(0, count);
    const matched = ids.map(id => others.find(p => (p.id === id || p.firebaseKey === id))).filter(Boolean);
    return matched.length > 0 ? matched.slice(0, count) : others.slice(0, count);
  }

  async function areaIntelligence(areaName, properties) {
    const stats = {
      totalListings: properties ? properties.length : 0,
      avgPrice: properties && properties.length > 0 ? Math.round(properties.reduce((s, p) => s + (Number(p.price) || 0), 0) / properties.length) : 0,
      propertyTypes: properties ? [...new Set(properties.map(p => p.type || p.propertyType || "").filter(Boolean))] : []
    };
    const prompt = `Provide detailed area intelligence for "${areaName || "this location"}" based on the following property market data:

Total Listings: ${stats.totalListings}
Average Price: ${stats.avgPrice}
Property Types: ${stats.propertyTypes.join(", ") || "Mixed"}
${properties ? "Sample properties: " + JSON.stringify(properties.slice(0, 5).map(p => ({ title: p.title, price: p.price, type: p.type || p.propertyType, location: p.location }))) : ""}

Return ONLY valid JSON:
{
  "investmentPotential": { "score": <0-100>, "description": "..." },
  "rentalDemand": { "score": <0-100>, "description": "..." },
  "futureDevelopment": { "score": <0-100>, "description": "..." },
  "trafficScore": { "score": <0-100>, "description": "..." },
  "walkabilityScore": { "score": <0-100>, "description": "..." },
  "nearbySchools": ["school1", "school2"],
  "nearbyHospitals": ["hospital1", "hospital2"],
  "nearbyShopping": ["place1", "place2"],
  "safetyIndex": { "score": <0-100>, "description": "..." },
  "overallScore": <0-100>
}`;
    const result = await callGroq(prompt, "You are a real estate area intelligence analyst. Return ONLY valid JSON.", 0.2);
    return parseJSON(result) || {
      investmentPotential: { score: 65, description: "Average investment potential." },
      rentalDemand: { score: 60, description: "Moderate rental demand." },
      futureDevelopment: { score: 50, description: "Limited development data." },
      trafficScore: { score: 50, description: "Average traffic." },
      walkabilityScore: { score: 50, description: "Average walkability." },
      nearbySchools: [],
      nearbyHospitals: [],
      nearbyShopping: [],
      safetyIndex: { score: 60, description: "Average safety." },
      overallScore: 60
    };
  }

  async function marketOverview(properties) {
    const total = properties ? properties.length : 0;
    const prices = properties ? properties.map(p => Number(p.price) || 0) : [];
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const cities = properties ? [...new Set(properties.map(p => {
      const loc = p.location || "";
      const parts = loc.split(",");
      return parts[parts.length - 1]?.trim() || loc;
    }).filter(Boolean))] : [];
    const types = properties ? [...new Set(properties.map(p => p.type || p.propertyType || "").filter(Boolean))] : [];

    const prompt = `Analyze this real estate market data and provide key insights:

Total Listings: ${total}
Average Price: ${avgPrice}
Cities: ${cities.join(", ") || "Various"}
Property Types: ${types.join(", ") || "Mixed"}
Price Range: ${prices.length > 0 ? Math.min(...prices) + " - " + Math.max(...prices) : "N/A"}

Return ONLY valid JSON:
{
  "totalActiveListings": ${total},
  "averagePrice": ${avgPrice},
  "topPerformingAreas": ["area1", "area2", "area3"],
  "mostViewedCities": ${JSON.stringify(cities.slice(0, 5))},
  "trendingPropertyTypes": ${JSON.stringify(types.slice(0, 5))},
  "priceTrend": "increasing/stable/decreasing",
  "marketHealth": "strong/moderate/weak",
  "insight": "one paragraph market summary"
}`;
    const result = await callGroq(prompt, "You are a real estate market analyst. Return ONLY valid JSON.", 0.2);
    return parseJSON(result) || {
      totalActiveListings: total,
      averagePrice: avgPrice,
      topPerformingAreas: cities.slice(0, 3),
      mostViewedCities: cities.slice(0, 5),
      trendingPropertyTypes: types.slice(0, 5),
      priceTrend: "stable",
      marketHealth: "moderate",
      insight: "Market analysis based on available data."
    };
  }

  return {
    callGroq,
    propertySummary,
    investmentScore,
    lifestyleMatch,
    prosCons,
    pricePrediction,
    similarProperties,
    areaIntelligence,
    marketOverview
  };
})();

window.AIEngine = AIEngine;
