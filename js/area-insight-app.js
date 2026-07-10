document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("areaInsightBtn");
  const input = document.getElementById("areaInsightInput");
  const output = document.getElementById("areaInsightOutput");
  if (!btn || !input || !output) return;

  btn.addEventListener("click", async () => {
    const location = input.value.trim();
    if (!location) return;
    output.innerHTML = '<p style="color:#888">Loading insight...</p>';
    const result = await getAreaInsight(location);
    output.innerHTML = result ? `<div style="white-space:pre-wrap;line-height:1.6">${result}</div>` : '<p style="color:#e94560">Unable to fetch area insight. Check your API key.</p>';
  });
});
