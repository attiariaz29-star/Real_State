async function getRecommendations(preferences) {
  const prompt = `Based on these preferences, recommend real estate properties: Budget: $${preferences.budget || 'N/A'}, Location: ${preferences.location || 'N/A'}, Bedrooms: ${preferences.bedrooms || 'N/A'}, Type: ${preferences.type || 'N/A'}, Priorities: ${preferences.priorities || 'N/A'}. Provide 3-4 specific recommendations with reasoning.`;
  return await AI_CONFIG.callGemini(prompt, "You are a real estate recommendation specialist.");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("recommendBtn");
  const output = document.getElementById("recommendOutput");
  if (!btn || !output) return;

  btn.addEventListener("click", async () => {
    const prefs = {
      budget: document.getElementById("recBudget")?.value || "",
      location: document.getElementById("recLocation")?.value || "",
      bedrooms: document.getElementById("recBedrooms")?.value || "",
      type: document.getElementById("recType")?.value || "",
      priorities: document.getElementById("recPriorities")?.value || ""
    };
    output.innerHTML = '<p style="color:#888">Generating recommendations...</p>';
    const result = await getRecommendations(prefs);
    output.innerHTML = result ? `<div style="white-space:pre-wrap;line-height:1.6">${result}</div>` : '<p style="color:#e94560">Unable to generate recommendations.</p>';
  });
});
