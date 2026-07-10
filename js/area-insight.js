async function getAreaInsight(location) {
  const prompt = `Provide a detailed real estate area insight for: ${location}. Include neighborhood overview, price trends, school ratings, crime statistics, commute options, and future development plans. Format with clear sections.`;
  return await AI_CONFIG.callGemini(prompt, "You are a real estate area analyst providing factual market insights.");
}
