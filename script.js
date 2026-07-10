/**
 * NESTFINDER AI RECOMMENDATIONS – APP CONTROLLER
 * Renders all sections, wires up interactions, handles comparisons
 */

document.addEventListener("DOMContentLoaded", () => {
  const { AIEngine, AREA_DATABASE, AI_PROPERTIES, MARKET_INSIGHTS } = window.NestFinderAI;

  // ─── Initial State ───────────────────────────────────────────────────────────
  let prefs = { purpose: "buy", lifestyle: "family", budget: "mid" };

  // ─── Utility ─────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const fmt = n => n >= 10000000
    ? "PKR " + (n / 10000000).toFixed(2) + " Cr"
    : n >= 100000
    ? "PKR " + (n / 100000).toFixed(0) + " L"
    : "PKR " + n.toLocaleString() + "/mo";

  // ─── Theme ───────────────────────────────────────────────────────────────────
  function initTheme() {
    const toggle = $("themeToggle"), icon = $("themeIcon"), html = document.documentElement;
    const saved = localStorage.getItem("nestfinder_theme") || "light";
    html.setAttribute("data-bs-theme", saved);
    updateIcon(saved);
    toggle.addEventListener("click", () => {
      const next = html.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-bs-theme", next);
      localStorage.setItem("nestfinder_theme", next);
      updateIcon(next);
    });
    function updateIcon(t) {
      icon.className = t === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      toggle.classList.toggle("btn-outline-warning", t === "dark");
      toggle.classList.toggle("btn-outline-light",   t !== "dark");
    }
  }

  // ─── Navbar Scroll ───────────────────────────────────────────────────────────
  function initNavbar() {
    const nav = $("mainNav");
    window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 50));
  }

  // ─── Back to top ─────────────────────────────────────────────────────────────
  function initBackToTop() {
    const btn = $("backToTop");
    window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // ─── Market Stats Ribbon ─────────────────────────────────────────────────────
  function renderStats() {
    $("quarterlyText").textContent = MARKET_INSIGHTS.quarterlyReport;
  }

  // ─── AI Loading Overlay ──────────────────────────────────────────────────────
  const LOADING_MSGS = [
    "Understanding your lifestyle profile…",
    "Scoring 10 areas across 6 metrics…",
    "Calculating growth & yield potential…",
    "Generating AI match explanations…",
    "Finalising your personalised report…"
  ];
  async function showLoading(fn) {
    const overlay = $("aiLoadingOverlay");
    const msg     = $("aiLoadingMsg");
    overlay.classList.remove("d-none");
    for (let i = 0; i < LOADING_MSGS.length; i++) {
      msg.textContent = LOADING_MSGS[i];
      await delay(480);
    }
    overlay.classList.add("d-none");
    fn();
  }
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // ─── SECTION: TOP AI PICKS ───────────────────────────────────────────────────
  function renderTopPicks(filter = "all") {
    // Filter by budget tier — each tier shows completely different properties
    let pool;
    if (filter === "all") {
      pool = AI_PROPERTIES; // show all 12
    } else {
      pool = AI_PROPERTIES.filter(p => p.budget === filter);
    }

    // Deduplicate by id (safety guard — no repeats)
    const seen = new Set();
    const filtered = pool.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    if (filtered.length === 0) {
      $("topPicksGrid").innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="empty-state-box">
            <i class="bi bi-search-heart"></i>
            <h5>No properties found for this tier</h5>
            <p class="text-muted small">Try a different budget filter or run AI Analysis with your preferences.</p>
          </div>
        </div>`;
      return;
    }

    const tagMap = {
      "Hot Deal": "hot", "AI Top Pick": "blue", "Best Value": "green",
      "High Growth": "green", "Investment": "amber", "Trending": "hot",
      "Budget Friendly": "green", "Premium": "amber", "Popular": "blue",
      "Fastest Growing": "hot"
    };

    // Badge color based on budget tier
    const tierColor = { budget: "#10b981", mid: "#f59e0b", premium: "#ef4444" };
    const tierLabel = { budget: "Budget", mid: "Mid-Range", premium: "Premium" };

    $("topPicksGrid").innerHTML = filtered.map(p => {
      const isTop = p.aiScore >= 94;
      const tags = p.tags.slice(0, 2).map(t =>
        `<span class="ai-tag ${tagMap[t] || 'blue'}">${t}</span>`).join("");
      const area = AREA_DATABASE.find(a => a.id === p.area);
      const budgeLabel = tierLabel[p.budget] || "";
      const budgeColor = tierColor[p.budget] || "#f59e0b";

      return `
        <div class="col-lg-4 col-md-6">
          <div class="ai-prop-card" onclick="openPropModal('${p.id}')">
            <div class="ai-card-img-wrap">
              <img src="${p.image}" alt="${p.title}" loading="lazy">
              <div class="ai-card-tags">${tags}</div>
              <div class="ai-score-badge ${isTop ? 'top' : ''}">
                <i class="bi bi-stars"></i> ${p.aiScore}% AI
              </div>
            </div>
            <div class="ai-card-body">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="ai-card-price">${p.priceDisplay}</div>
                <span class="tier-pill" style="background:${budgeColor}22;color:${budgeColor};border:1px solid ${budgeColor}44;">${budgeLabel}</span>
              </div>
              <div class="ai-card-title">${p.title}</div>
              <div class="ai-card-loc">
                <i class="bi bi-geo-alt-fill" style="color:#f59e0b"></i>
                ${area?.name || ''} · ${p.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
              </div>
              <div class="ai-card-specs">
                <span><i class="bi bi-bed-fill"></i>${p.beds} Beds</span>
                <span><i class="bi bi-water"></i>${p.baths} Baths</span>
                <span><i class="bi bi-rulers"></i>${p.size}</span>
              </div>
              <div class="ai-reason-chip"><i class="bi bi-robot me-1"></i>${p.aiReason}</div>
              <div class="score-bar-wrap">
                <div class="score-bar-label"><span>AI Match Score</span><span>${p.aiScore}%</span></div>
                <div class="score-bar-track">
                  <div class="score-bar-fill" style="width:${p.aiScore}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }).join("");
    animateBars();
  }

  // Filter pills — budget tier switching
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTopPicks(btn.dataset.filter);
    });
  });

  // ─── SECTION: MARKET INSIGHTS ────────────────────────────────────────────────
  function renderMarketInsights() {
    // Hot cities
    const ranked = [...AREA_DATABASE].sort((a,b) => b.priceYoY - a.priceYoY).slice(0,5);
    $("hotCitiesList").innerHTML = ranked.map((a,i) => `
      <div class="hot-city-row">
        <span class="hot-rank">${i+1}</span>
        <span class="flex-grow-1 fw-semibold">${a.name}</span>
        <span class="text-muted small me-2">${a.city}</span>
        <span class="hot-growth">+${a.priceYoY}%</span>
      </div>`).join("");

    // Heatmap zones
    const zones = AIEngine.getPriceZones();
    const byZone = { high: zones.filter(z=>z.zone==="high"), mid: zones.filter(z=>z.zone==="mid"), low: zones.filter(z=>z.zone==="low") };
    let html = "";
    for (const [zone, areas] of Object.entries(byZone)) {
      areas.forEach(z => {
        html += `
          <div class="hm-zone-row">
            <span class="hm-zone-dot" style="background:${z.color}"></span>
            <span class="hm-zone-name">${z.name}</span>
            <span class="hm-zone-price">${z.city} · ${fmt(z.buyAvg)}</span>
          </div>`;
      });
    }
    $("heatmapZones").innerHTML = html;
  }

  // ─── SECTION: TRENDING AREAS ─────────────────────────────────────────────────
  function renderTrending() {
    const trending = AREA_DATABASE.filter(a => a.trending).sort((a,b) => b.priceYoY - a.priceYoY);
    $("trendingGrid").innerHTML = trending.map(a => {
      const m = a.metrics;
      return `
        <div class="col-lg-3 col-md-6">
          <div class="trending-card">
            <div class="trending-img-wrap">
              <img src="${a.image}" alt="${a.name}" loading="lazy">
              <span class="trending-badge">🔥 +${a.priceYoY}% YoY</span>
            </div>
            <div class="trending-body">
              <h4>${a.name}</h4>
              <div class="trending-city"><i class="bi bi-geo-alt text-primary"></i>${a.city}</div>
              <p class="text-muted small mt-2 mb-2" style="font-size:0.78rem;line-height:1.5;">${a.description.slice(0,90)}…</p>
              <div class="d-flex gap-2 flex-wrap mb-2">
                <span class="yoy-badge"><i class="bi bi-graph-up-arrow"></i>+${a.priceYoY}%</span>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill" style="font-size:0.7rem">${a.properties} listings</span>
              </div>
              <div class="metric-row">
                ${metricBar('Safety', m.safety, 'fill-safety')}
                ${metricBar('Affordability', m.affordability, 'fill-afford')}
                ${metricBar('Growth', m.growth, 'fill-growth')}
                ${metricBar('Connectivity', m.connectivity, 'fill-connect')}
              </div>
            </div>
          </div>
        </div>`;
    }).join("");
    animateBars();
  }
  function metricBar(label, val, cls) {
    return `
      <div class="metric-item">
        <div class="metric-label"><span>${label}</span><span>${val}/100</span></div>
        <div class="metric-track"><div class="metric-fill ${cls}" style="width:0%" data-target="${val}%"></div></div>
      </div>`;
  }

  // ─── SECTION: COMPARISON ─────────────────────────────────────────────────────
  function populateCompareDropdowns() {
    const options = AREA_DATABASE.map(a => `<option value="${a.id}">${a.name} — ${a.city}</option>`).join("");
    $("compareA").innerHTML = options;
    $("compareB").innerHTML = options;
    $("compareA").value = "bahria_khi";
    $("compareB").value = "dha6";
  }

  $("runCompareBtn").addEventListener("click", () => {
    const idA = $("compareA").value, idB = $("compareB").value;
    if (idA === idB) { alert("Please select two different areas to compare."); return; }
    const result = AIEngine.compareAreas(idA, idB, prefs);
    renderCompare(result);
  });

  function renderCompare(r) {
    const el = $("compareResult");
    el.classList.remove("d-none");
    const metrics = Object.entries(r.factors);
    const factorRows = metrics.map(([key, f]) => {
      const pctA = (f.scoreA / 100) * 100, pctB = (f.scoreB / 100) * 100;
      const winnerA = f.winner === 'a', winnerB = f.winner === 'b';
      return `
        <div class="mb-3">
          <div class="compare-factor-row">
            <div class="text-end">
              <div class="compare-val ${winnerA ? 'text-primary' : 'text-muted'}">${f.scoreA} ${winnerA ? '🏆' : ''}</div>
              <div class="compare-bar-a" style="width:${pctA}%;margin-left:auto"></div>
            </div>
            <div class="compare-label">${f.label}</div>
            <div class="text-start">
              <div class="compare-val ${winnerB ? 'text-primary' : 'text-muted'}">${winnerB ? '🏆' : ''} ${f.scoreB}</div>
              <div class="compare-bar-b" style="width:${pctB}%"></div>
            </div>
          </div>
        </div>`;
    }).join("");

    el.innerHTML = `
      <div class="compare-winner-banner">
        <i class="bi bi-trophy-fill"></i>
        <div>
          <div class="fw-bold fs-5">🏆 Winner: ${r.overallWinner.name}</div>
          <div class="opacity-85 small">${r.explanation}</div>
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-6 text-center fw-bold text-primary fs-5">${r.a.name}<br><small class="text-muted fw-normal fs-6">${r.a.city} · Score: ${r.totalScoreA}</small></div>
        <div class="col-6 text-center fw-bold text-primary fs-5">${r.b.name}<br><small class="text-muted fw-normal fs-6">${r.b.city} · Score: ${r.totalScoreB}</small></div>
      </div>
      ${factorRows}
      <div class="row g-3 mt-1">
        <div class="col-6">
          <div class="p-3 rounded-3 border text-center">
            <div class="fw-bold mb-1">${r.a.name}</div>
            <div class="small text-muted">Rent: ${fmt(r.a.rentAvg)} / Buy: ${fmt(r.a.buyAvg)}</div>
            <div class="small text-success fw-semibold mt-1">+${r.a.priceYoY}% YoY</div>
          </div>
        </div>
        <div class="col-6">
          <div class="p-3 rounded-3 border text-center">
            <div class="fw-bold mb-1">${r.b.name}</div>
            <div class="small text-muted">Rent: ${fmt(r.b.rentAvg)} / Buy: ${fmt(r.b.buyAvg)}</div>
            <div class="small text-success fw-semibold mt-1">+${r.b.priceYoY}% YoY</div>
          </div>
        </div>
      </div>`;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ─── SECTION: INVESTMENT OPPORTUNITIES ───────────────────────────────────────
  function renderInvestment() {
    const ranked = [...AREA_DATABASE]
      .map(a => ({ ...a, investScore: a.metrics.growth * 0.4 + (a.priceYoY * 2) + a.metrics.safety * 0.15 + a.metrics.connectivity * 0.1 }))
      .sort((a,b) => b.investScore - a.investScore)
      .slice(0,6);

    $("investmentGrid").innerHTML = ranked.map((a, i) => {
      const fiveYearROI = (a.priceYoY * 3.8).toFixed(1);
      return `
        <div class="col-lg-4 col-md-6">
          <div class="invest-card">
            <div class="d-flex align-items-start gap-2 mb-2">
              <div class="invest-rank">#${i+1}</div>
              <div>
                <div class="invest-area-name">${a.name}</div>
                <div class="invest-city">${a.city}</div>
              </div>
            </div>
            <div class="invest-metrics">
              <div class="invest-metric-item">
                <span class="invest-metric-lbl">Price YoY Growth</span>
                <span class="invest-metric-val green">+${a.priceYoY}%</span>
              </div>
              <div class="invest-metric-item">
                <span class="invest-metric-lbl">Growth Potential</span>
                <span class="invest-metric-val primary">${a.metrics.growth}/100</span>
              </div>
              <div class="invest-metric-item">
                <span class="invest-metric-lbl">Safety Score</span>
                <span class="invest-metric-val">${a.metrics.safety}/100</span>
              </div>
              <div class="invest-metric-item">
                <span class="invest-metric-lbl">Active Listings</span>
                <span class="invest-metric-val">${a.properties}</span>
              </div>
              <div class="invest-metric-item">
                <span class="invest-metric-lbl">Avg Buy Price</span>
                <span class="invest-metric-val">${fmt(a.buyAvg)}</span>
              </div>
              <div class="invest-metric-item">
                <span class="invest-metric-lbl">Price Zone</span>
                <span class="invest-metric-val">${a.zone.toUpperCase()}</span>
              </div>
            </div>
            <div class="projected-roi">
              <div class="projected-roi-val">${fiveYearROI}%</div>
              <div class="projected-roi-lbl">Projected 5-Year ROI (est.)</div>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  // ─── SECTION: PERSONALIZED MATCHES ───────────────────────────────────────────
  function renderMatches() {
    const matches = AIEngine.matchAreas(prefs).slice(0,6);
    $("matchGrid").innerHTML = matches.map(a => {
      const deg = Math.round((a.matchScore / 100) * 360);
      const pills = [
        { lbl: `Safety ${a.metrics.safety}` },
        { lbl: `Growth ${a.metrics.growth}%` },
        { lbl: `${a.city}` }
      ];
      return `
        <div class="col-lg-4 col-md-6">
          <div class="match-card">
            <div class="d-flex align-items-center mb-1">
              <div class="match-score-ring" style="--deg:${deg}deg">
                <span class="match-score-num">${a.matchScore}%</span>
              </div>
              <div>
                <div class="match-area-name">${a.name}</div>
                <div class="match-city">${a.city} · ${a.zone.toUpperCase()} Zone</div>
              </div>
            </div>
            <div class="match-reason">${a.reason}</div>
            <div class="match-metric-pills">
              ${pills.map(p => `<span class="match-pill">${p.lbl}</span>`).join("")}
              <span class="match-pill">+${a.priceYoY}% YoY</span>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  // ─── SECTION: AI TIPS ────────────────────────────────────────────────────────
  function renderTips() {
    const tips = AIEngine.getPersonalizedTips(prefs);
    const typeColors = { growth: "blue", safety: "green", value: "green", connectivity: "blue",
                         investment: "amber", strategy: "amber", health: "green", wellness: "green", ai: "blue", timing: "amber" };
    $("aiTipsGrid").innerHTML = tips.map(t => `
      <div class="col-lg-6">
        <div class="ai-tip-card">
          <div class="ai-tip-icon"><i class="bi ${t.icon}"></i></div>
          <div>
            <div class="ai-tip-type">${t.type}</div>
            <div class="ai-tip-text">${t.text}</div>
          </div>
        </div>
      </div>`).join("");
  }

  // ─── AI RUN ANALYSIS ─────────────────────────────────────────────────────────
  $("runAiBtn").addEventListener("click", () => {
    prefs.purpose   = $("prefPurpose").value;
    prefs.lifestyle = $("prefLifestyle").value;
    prefs.budget    = $("prefBudget").value;
    showLoading(() => {
      renderTopPicks("all");
      renderMatches();
      renderTips();
      document.querySelector("#topPicks").scrollIntoView({ behavior: "smooth" });
    });
  });

  // ─── PROPERTY MODAL ──────────────────────────────────────────────────────────
  window.openPropModal = function(id) {
    const p = AI_PROPERTIES.find(x => x.id === id);
    if (!p) return;
    const area = AREA_DATABASE.find(a => a.id === p.area);
    $("propDetailModalLabel").textContent = p.title;
    $("propDetailBody").innerHTML = `
      <div class="row g-4">
        <div class="col-md-6">
          <img src="${p.image}" alt="${p.title}" class="img-fluid rounded-4 w-100" style="height:280px;object-fit:cover">
        </div>
        <div class="col-md-6">
          <div class="fs-3 fw-bold text-primary mb-2">${p.priceDisplay}</div>
          <div class="text-muted small mb-3"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${area?.name || ''}, ${area?.city || ''}</div>
          <div class="d-flex gap-3 mb-3 flex-wrap">
            <span><i class="bi bi-bed-fill text-primary me-1"></i>${p.beds} Beds</span>
            <span><i class="bi bi-water text-primary me-1"></i>${p.baths} Baths</span>
            <span><i class="bi bi-rulers text-primary me-1"></i>${p.size}</span>
            <span><i class="bi bi-house-door text-primary me-1"></i>${p.type}</span>
          </div>
          <div class="ai-reason-chip mb-3"><i class="bi bi-robot me-1"></i>${p.aiReason}</div>
          <div class="d-flex flex-wrap gap-2 mb-3">
            ${p.features.map(f => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">${f}</span>`).join("")}
          </div>
          <div class="score-bar-wrap">
            <div class="score-bar-label"><span>AI Match Score</span><span>${p.aiScore}%</span></div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${p.aiScore}%"></div></div>
          </div>
        </div>
      </div>
      <div class="mt-3 border-top pt-3">
        <p class="text-muted small mb-2"><strong>Area Overview:</strong> ${area?.description || ''}</p>
        <div class="row g-2 text-center">
          ${['safety','affordability','connectivity','growth'].map(m => `
            <div class="col-3">
              <div class="p-2 border rounded-3">
                <div class="fw-bold text-primary">${area?.metrics[m] || 'N/A'}</div>
                <div class="text-muted" style="font-size:0.7rem">${m.charAt(0).toUpperCase()+m.slice(1)}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>
      <div class="mt-3 d-flex gap-2">
        <a href="listing.html?area=${p.area}" class="btn btn-primary flex-grow-1 fw-semibold">
          <i class="bi bi-check-circle-fill me-1"></i>Select Property
        </a>
        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
      </div>`;
    new bootstrap.Modal($("propDetailModal")).show();
  };

  // ─── Animate score bars on scroll ────────────────────────────────────────────
  function animateBars() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          el.style.width = el.dataset.target || el.style.width;
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll(".score-bar-fill, .metric-fill").forEach(el => {
      if (el.dataset.target) {
        el.style.width = "0%";
        observer.observe(el);
      }
    });
  }

  // ─── INITIAL RENDER ──────────────────────────────────────────────────────────
  initTheme();
  initNavbar();
  initBackToTop();
  renderStats();
  renderTopPicks();
  renderMarketInsights();
  renderTrending();
  populateCompareDropdowns();
  renderInvestment();
  renderMatches();
  renderTips();
});
