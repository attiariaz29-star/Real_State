const AreaIntelligenceEnhanced = (function() {
  let _allProperties = [];
  let _currentAreaData = null;

  async function init(properties) {
    _allProperties = properties || [];
    const container = document.getElementById("areaIntelligenceEnhanced");
    if (!container) return;
    container.innerHTML = `
      <div class="ai-section-title mt-5 mb-1"><i class="bi bi-compass me-2" style="color:#f59e0b"></i>Enhanced Area Intelligence</div>
      <p class="ai-section-sub">AI-powered neighborhood analysis based on live property data</p>
      <div class="row g-3 mb-4" id="areaScoreGrid">
        ${[ 
          { id:"scoreInvestment", label:"Investment Potential", icon:"bi-graph-up-arrow", color:"#22c55e" },
          { id:"scoreRental", label:"Rental Demand", icon:"bi-cash-stack", color:"#3b82f6" },
          { id:"scoreDevelopment", label:"Future Development", icon:"bi-building-gear", color:"#a855f7" },
          { id:"scoreTraffic", label:"Traffic Score", icon:"bi-car-front", color:"#f59e0b" },
          { id:"scoreWalkability", label:"Walkability", icon:"bi-person-walking", color:"#10b981" },
          { id:"scoreSafety", label:"Safety Index", icon:"bi-shield-check", color:"#ef4444" }
        ].map(s => `
          <div class="col-md-4 col-6">
            <div class="ai-score-card">
              <div class="ai-score-card-icon" style="background:${s.color}18;color:${s.color}"><i class="bi ${s.icon}"></i></div>
              <div style="font-size:0.85rem;font-weight:600;margin-bottom:0.25rem">${s.label}</div>
              <div id="${s.id}"><div class="ai-skeleton" style="height:20px;width:60%"></div></div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="ai-score-card">
            <div class="ai-score-card-icon" style="background:#f59e0b18;color:#f59e0b"><i class="bi bi-trophy"></i></div>
            <div style="font-size:0.85rem;font-weight:600;margin-bottom:0.25rem">Overall AI Area Score</div>
            <div id="overallAreaScore"><div class="ai-skeleton" style="height:24px;width:50%"></div></div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="ai-score-card">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-geo-alt" style="color:#f59e0b"></i>
              <strong>Nearby Places</strong>
            </div>
            <div class="row g-2" id="nearbyPlacesGrid">
              <div class="col-4"><div class="ai-skeleton" style="height:16px"></div></div>
              <div class="col-4"><div class="ai-skeleton" style="height:16px"></div></div>
            </div>
          </div>
        </div>
      </div>`;
    await loadEnhancedData();
  }

  async function loadEnhancedData() {
    const areas = extractAreas(_allProperties);
    if (areas.length === 0) {
      document.querySelectorAll("#areaScoreGrid .ai-score-card > div:last-child").forEach(el => {
        el.innerHTML = '<span class="text-muted" style="font-size:0.85rem">No data</span>';
      });
      const overall = document.getElementById("overallAreaScore");
      if (overall) overall.innerHTML = '<span class="text-muted">Add properties to see scores</span>';
      return;
    }

    const primaryArea = areas[0];
    const areaProps = _allProperties.filter(p =>
      (p.location || "").toLowerCase().includes(primaryArea.toLowerCase())
    );

    const data = await AIEngine.areaIntelligence(primaryArea, areaProps);
    if (!data) {
      document.getElementById("overallAreaScore").innerHTML = '<span class="text-muted">Analysis unavailable</span>';
      return;
    }
    _currentAreaData = data;

    renderScore("scoreInvestment", data.investmentPotential);
    renderScore("scoreRental", data.rentalDemand);
    renderScore("scoreDevelopment", data.futureDevelopment);
    renderScore("scoreTraffic", data.trafficScore);
    renderScore("scoreWalkability", data.walkabilityScore);
    renderScore("scoreSafety", data.safetyIndex);

    const overall = document.getElementById("overallAreaScore");
    if (overall && data.overallScore !== undefined) {
      const s = Math.min(100, Math.max(0, data.overallScore));
      const c = s >= 75 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";
      overall.innerHTML = `
        <div style="font-size:2rem;font-weight:800;color:${c}">${s}<span style="font-size:1rem;font-weight:400;color:rgba(128,128,128,0.5)">/100</span></div>
        <div class="ai-progress-track"><div class="ai-progress-fill" style="width:${s}%;background:${c}"></div></div>`;
    }

    const nearbyGrid = document.getElementById("nearbyPlacesGrid");
    if (nearbyGrid) {
      const sections = [
        { label: "Schools", items: data.nearbySchools || [], icon: "bi-mortarboard" },
        { label: "Hospitals", items: data.nearbyHospitals || [], icon: "bi-heart-pulse" },
        { label: "Shopping", items: data.nearbyShopping || [], icon: "bi-bag" }
      ];
      nearbyGrid.innerHTML = sections.map(s => `
        <div class="col-4">
          <div style="font-size:0.75rem;font-weight:600;margin-bottom:0.35rem"><i class="bi ${s.icon} me-1" style="color:#f59e0b"></i>${s.label}</div>
          ${s.items.length > 0 ? s.items.map(item => `<span class="badge bg-light text-dark border rounded-pill me-1 mb-1" style="font-size:0.7rem">${item}</span>`).join("") : '<span class="text-muted" style="font-size:0.7rem">N/A</span>'}
        </div>
      `).join("");
    }
  }

  function renderScore(elementId, data) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!data || data.score === undefined) {
      el.innerHTML = '<span class="text-muted" style="font-size:0.85rem">N/A</span>';
      return;
    }
    const s = Math.min(100, Math.max(0, data.score));
    const c = s >= 70 ? "#22c55e" : s >= 45 ? "#f59e0b" : "#ef4444";
    el.innerHTML = `
      <div style="font-size:1.25rem;font-weight:700;color:${c}">${s}<span style="font-size:0.75rem;font-weight:400;color:rgba(128,128,128,0.5)">/100</span></div>
      <div class="ai-progress-track"><div class="ai-progress-fill" style="width:${s}%;background:${c}"></div></div>
      <small style="color:rgba(128,128,128,0.6);font-size:0.7rem">${data.description || ""}</small>`;
  }

  function extractAreas(properties) {
    const areaMap = {};
    (properties || []).forEach(p => {
      const loc = p.location || "";
      const parts = loc.split(",").map(s => s.trim()).filter(Boolean);
      const area = parts.length > 1 ? parts[parts.length - 2] : parts[0] || "Unknown";
      areaMap[area] = (areaMap[area] || 0) + 1;
    });
    return Object.entries(areaMap).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  }

  function refresh(data) {
    _currentAreaData = data;
  }

  return { init, refresh };
})();

window.AreaIntelligenceEnhanced = AreaIntelligenceEnhanced;
