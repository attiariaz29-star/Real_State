const PropertyDetailsAI = (function() {
  let _currentProperty = null;
  let _allProperties = [];

  function init(property, allProps) {
    _currentProperty = property;
    _allProperties = allProps || [];
    const container = document.getElementById("aiPropertyDetails");
    if (!container) return;
    container.innerHTML = `
      <div class="ai-pd-section mb-4" id="aiSummarySection">
        <div class="ai-pd-header"><i class="bi bi-stars"></i> AI Property Summary</div>
        <div id="aiSummaryContent" class="ai-pd-body"><div class="ai-pd-loading"></div></div>
      </div>
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="ai-pd-section h-100" id="aiScoreSection">
            <div class="ai-pd-header"><i class="bi bi-graph-up-arrow"></i> AI Investment Score</div>
            <div id="aiScoreContent" class="ai-pd-body text-center"><div class="ai-pd-loading"></div></div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="ai-pd-section h-100" id="aiPredictionSection">
            <div class="ai-pd-header"><i class="bi bi-bar-chart-line"></i> AI Price Prediction</div>
            <div id="aiPredictionContent" class="ai-pd-body"><div class="ai-pd-loading"></div></div>
          </div>
        </div>
      </div>
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="ai-pd-section h-100" id="aiLifestyleSection">
            <div class="ai-pd-header"><i class="bi bi-people"></i> AI Lifestyle Match</div>
            <div id="aiLifestyleContent" class="ai-pd-body"><div class="ai-pd-loading"></div></div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="ai-pd-section h-100" id="aiProsConsSection">
            <div class="ai-pd-header"><i class="bi bi-list-check"></i> AI Pros & Cons</div>
            <div id="aiProsConsContent" class="ai-pd-body"><div class="ai-pd-loading"></div></div>
          </div>
        </div>
      </div>
      <div class="ai-pd-section mb-4" id="aiSimilarSection">
        <div class="ai-pd-header"><i class="bi bi-diagram-3"></i> Similar Properties</div>
        <div id="aiSimilarContent" class="ai-pd-body"><div class="ai-pd-loading"></div></div>
      </div>
    `;
    loadAll();
  }

  async function loadAll() {
    await Promise.all([
      loadSummary(),
      loadScore(),
      loadPrediction(),
      loadLifestyle(),
      loadProsCons(),
      loadSimilar()
    ]);
  }

  async function loadSummary() {
    const el = document.getElementById("aiSummaryContent");
    if (!el) return;
    const data = await AIEngine.propertySummary(_currentProperty);
    el.innerHTML = data.summary
      ? `<p class="ai-pd-summary-text">${data.summary}</p>
         <div class="mt-2"><strong>Target Buyers:</strong> ${data.targetBuyers || "N/A"}</div>
         <div class="mt-1"><strong>Investment Potential:</strong>
           <span class="badge ${data.investmentPotential === 'high' ? 'bg-success' : data.investmentPotential === 'low' ? 'bg-danger' : 'bg-warning text-dark'}">${data.investmentPotential}</span>
         </div>
         ${data.strengths && data.strengths.length > 0 ? '<div class="mt-2"><strong>Strengths:</strong><ul class="mb-0 mt-1">' + data.strengths.map(s => '<li class="ai-pd-strength-item">' + s + '</li>').join("") + '</ul></div>' : ''}`
      : '<p class="text-muted">AI summary unavailable.</p>';
  }

  async function loadScore() {
    const el = document.getElementById("aiScoreContent");
    if (!el) return;
    const data = await AIEngine.investmentScore(_currentProperty, _allProperties);
    const score = Math.min(100, Math.max(0, data.score));
    const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : score >= 30 ? "#f97316" : "#ef4444";
    el.innerHTML = `
      <div class="ai-score-ring" style="--score:${score}%;--color:${color}">
        <svg viewBox="0 0 120 120" class="ai-score-svg">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="${339.292 * score / 100} 339.292" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition: stroke-dasharray 1.5s ease"/>
        </svg>
        <div class="ai-score-value" style="color:${color}">${score}</div>
      </div>
      <div class="ai-score-label" style="color:${color}">${data.label || "Average"}</div>
      <p class="ai-score-reason small mt-2">${data.reason || ""}</p>
      <div class="ai-score-breakdown mt-2">
        ${Object.entries(data.breakdown || {}).map(([k, v]) => `
          <div class="d-flex justify-content-between small mb-1">
            <span class="text-capitalize">${k}</span>
            <div class="ai-score-bar-bg"><div class="ai-score-bar-fill" style="width:${Math.min(100, v * 4)}%;background:${color}"></div></div>
            <span class="fw-bold" style="color:${color}">${v}/25</span>
          </div>
        `).join("")}
      </div>`;
  }

  async function loadPrediction() {
    const el = document.getElementById("aiPredictionContent");
    if (!el) return;
    const data = await AIEngine.pricePrediction(_currentProperty);
    if (!data.predictions || data.predictions.length === 0) {
      el.innerHTML = '<p class="text-muted">Prediction unavailable.</p>';
      return;
    }
    const maxPrice = Math.max(...data.predictions.map(p => p.price), data.currentPrice);
    el.innerHTML = `
      <div class="ai-prediction-chart">
        <div class="ai-prediction-bars">
          <div class="ai-prediction-bar-group">
            <div class="ai-prediction-bar" style="height:${(data.currentPrice / maxPrice) * 140}px"><span>PKR ${formatNumber(data.currentPrice)}</span></div>
            <span class="ai-prediction-label">Now</span>
          </div>
          ${data.predictions.map(p => `
            <div class="ai-prediction-bar-group">
              <div class="ai-prediction-bar ai-prediction-future" style="height:${(p.price / maxPrice) * 140}px"><span>PKR ${formatNumber(p.price)}</span></div>
              <span class="ai-prediction-label">${p.year}Y</span>
              <span class="ai-prediction-app">+${p.appreciation}</span>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="text-center mt-2"><small class="text-muted">CAGR: ${data.cagr || "N/A"}</small></div>
      <p class="small mt-1 mb-0">${data.verdict || ""}</p>`;
  }

  async function loadLifestyle() {
    const el = document.getElementById("aiLifestyleContent");
    if (!el) return;
    const data = await AIEngine.lifestyleMatch(_currentProperty);
    const types = [
      { key: "families", label: "Families", icon: "bi-people-fill" },
      { key: "students", label: "Students", icon: "bi-mortarboard-fill" },
      { key: "professionals", label: "Professionals", icon: "bi-briefcase-fill" },
      { key: "investors", label: "Investors", icon: "bi-pie-chart-fill" },
      { key: "retired", label: "Retired", icon: "bi-umbrella-fill" }
    ];
    el.innerHTML = types.map(t => {
      const d = data[t.key] || { score: 0, reason: "" };
      const s = Math.min(100, Math.max(0, d.score));
      const c = s >= 70 ? "#22c55e" : s >= 45 ? "#f59e0b" : "#ef4444";
      return `<div class="ai-lifestyle-item">
        <div class="d-flex align-items-center gap-2 mb-1">
          <i class="bi ${t.icon}" style="color:${c}"></i>
          <strong>${t.label}</strong>
          <span class="ms-auto fw-bold" style="color:${c}">${s}%</span>
        </div>
        <div class="ai-lifestyle-bar-bg"><div class="ai-lifestyle-bar-fill" style="width:${s}%;background:${c}"></div></div>
        <small class="text-muted">${d.reason || ""}</small>
      </div>`;
    }).join("");
  }

  async function loadProsCons() {
    const el = document.getElementById("aiProsConsContent");
    if (!el) return;
    const data = await AIEngine.prosCons(_currentProperty);
    el.innerHTML = `<div class="row g-2">
      <div class="col-md-6">
        <h6 class="text-success mb-2"><i class="bi bi-check-circle-fill me-1"></i>Pros</h6>
        ${(data.pros || []).map(p => `<div class="ai-pc-item ai-pc-pro"><strong>${p.title}:</strong> ${p.description}</div>`).join("") || '<p class="text-muted small">None identified.</p>'}
      </div>
      <div class="col-md-6">
        <h6 class="text-danger mb-2"><i class="bi bi-x-circle-fill me-1"></i>Cons</h6>
        ${(data.cons || []).map(c => `<div class="ai-pc-item ai-pc-con"><strong>${c.title}:</strong> ${c.description}</div>`).join("") || '<p class="text-muted small">None identified.</p>'}
      </div>
    </div>`;
  }

  async function loadSimilar() {
    const el = document.getElementById("aiSimilarContent");
    if (!el) return;
    const similar = await AIEngine.similarProperties(_currentProperty, _allProperties);
    if (!similar || similar.length === 0) {
      el.innerHTML = '<p class="text-muted">No similar properties found.</p>';
      return;
    }
    el.innerHTML = `<div class="row g-2">${similar.map(p => `
      <div class="col-md-3 col-6">
        <div class="ai-similar-card" onclick="window.location.href='listing.html?id=${p.id || ""}'">
          <div class="ai-similar-img" style="background-image:url('${p.images?.[0] || p.carouselImages?.[0] || "https://placehold.co/200x150?text=Property"}')"></div>
          <div class="ai-similar-info">
            <div class="ai-similar-title">${p.title || "Property"}</div>
            <div class="ai-similar-price">PKR ${formatNumber(p.price || 0)}</div>
            <small class="text-muted">${p.bedrooms || "N/A"} beds • ${p.location ? p.location.split(",")[0] : ""}</small>
          </div>
        </div>
      </div>
    `).join("")}</div>`;
  }

  function formatNumber(n) {
    n = Number(n);
    if (isNaN(n)) return "0";
    if (n >= 10000000) return (n / 10000000).toFixed(1) + " Cr";
    if (n >= 100000) return (n / 100000).toFixed(1) + " Lac";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toLocaleString();
  }

  return { init };
})();

window.PropertyDetailsAI = PropertyDetailsAI;
