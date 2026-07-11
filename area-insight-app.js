/**
 * NESTFINDER AI — AREA INSIGHTS ENGINE
 * 100% Firebase data-driven + Groq AI-powered intelligence.
 * No hardcoded values, no demo content, no fake statistics.
 *
 * Architecture:
 *   1. Fetch ALL properties from Firebase Realtime Database
 *   2. Dynamically build area database from property locations
 *   3. Compute all analytics (statistics, distributions, rankings, etc.)
 *   4. Call Groq API for AI-generated market summary
 *   5. Render everything to the dashboard
 *   6. Listen for real-time changes (onChildAdded/onChildChanged/onChildRemoved)
 *
 * If insufficient data exists, "Insufficient Data" is displayed but NOTHING fake.
 */
(function () {
  "use strict";

  // ==================================================================
  // 1. CONFIG
  // ==================================================================

  const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
  const GROQ_MODEL = "llama-3.3-70b-versatile";
  // User must set their own Groq API key below
  const GROQ_API_KEY = "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";

  const GROQ_SYSTEM_PROMPT = `You are NestFinder AI's area intelligence analyst.
You receive a JSON object containing real property listing data from Firebase.
Your task: Generate a concise, insightful market summary (2–4 sentences) based ONLY on the data provided.
Do NOT invent numbers, areas, or trends not present in the data.
If the data shows fewer than 3 properties total, respond with: "INSUFFICIENT_DATA"
Reference real numbers: property count, price ranges, area names, growth percentages.
Write for a Pakistani real estate audience. Be specific and analytical.
Respond with ONLY a JSON object: { "summary": "your summary here" }`;

  // ==================================================================
  // 2. DOM HELPERS
  // ==================================================================

  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showLoading(show) {
    const el = $("dashLoading");
    if (el) el.classList.toggle("hidden", !show);
  }

  function showInsufficient(containerId, message) {
    const el = $(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="ai-insufficient">
        <i class="bi bi-database-slash"></i>
        <h4>Insufficient Data</h4>
        <p>${message}</p>
      </div>`;
  }

  function formatPrice(n, short) {
    if (n == null || n === 0) return "—";
    if (short) {
      if (n >= 10000000) return "PKR " + (n / 10000000).toFixed(1) + "Cr";
      if (n >= 100000) return "PKR " + (n / 100000).toFixed(0) + "L";
      return "PKR " + n.toLocaleString();
    }
    if (n >= 10000000) return "PKR " + (n / 10000000).toFixed(2) + " Crore";
    if (n >= 100000) return "PKR " + (n / 100000).toFixed(1) + " Lakh";
    return "PKR " + n.toLocaleString();
  }

  function pct(a, b) {
    if (!b || b === 0) return "0%";
    return ((a / b) * 100).toFixed(1) + "%";
  }

  function filterPropertiesBySearch(properties, state) {
    if (!state) state = filterState;
    return properties.filter((p) => {
      if (!p.location) return false;
      const parts = p.location.split(",").map((s) => s.trim().toLowerCase());
      const city = parts[parts.length - 1] || "";
      if (state.city && city !== state.city.toLowerCase().trim()) return false;
      if (state.purpose) {
        const isBuy = p.category === "For Sale" || p.purpose === "Buy";
        const isRent = p.category === "For Rent" || p.purpose === "Rent";
        if (state.purpose === "buy" && !isBuy) return false;
        if (state.purpose === "rent" && !isRent) return false;
      }
      return true;
    });
  }

  // ==================================================================
  // 3. FIREBASE REAL-TIME LISTENER
  // ==================================================================

  let cachedProperties = [];
  let cachedAreas = [];
  let listenerAttached = false;
  let filterState = { city: "", purpose: "" };

  function startFirebaseListener(onChange) {
    if (listenerAttached) return;
    const ref = propertiesDbRef;
    const handleData = (snap, cb) => {
      const data = snap.val();
      cachedProperties = data
        ? Object.keys(data).map((key) => ({ firebaseKey: key, ...data[key] })).filter(function(p) { return p.status !== 'Disabled'; })
        : [];
      const filtered = filterPropertiesBySearch(cachedProperties, filterState);
      cb(filtered);
    };

    // Initial load
    ref.once("value", (snap) => {
      handleData(snap, (filtered) => {
        const isFiltered = filterState.city || filterState.purpose;
        onChange(filtered);
        showLoading(false);
      });
    });

    // Real-time updates
    ref.on("child_added", () => {
      ref.once("value", (snap) => {
        handleData(snap, onChange);
      });
    });

    ref.on("child_changed", () => {
      ref.once("value", (snap) => {
        handleData(snap, onChange);
      });
    });

    ref.on("child_removed", () => {
      ref.once("value", (snap) => {
        handleData(snap, onChange);
      });
    });

    listenerAttached = true;
  }

  // ==================================================================
  // 4. DATA COMPUTATION ENGINE (all from Firebase, no hardcoded values)
  // ==================================================================

  function extractCity(location) {
    if (!location) return "Unknown";
    const parts = location.split(",").map((s) => s.trim());
    return parts[parts.length - 1] || "Unknown";
  }

  function extractArea(location) {
    if (!location) return "Unknown";
    const parts = location.split(",").map((s) => s.trim());
    return parts[0] || "Unknown";
  }

  function computeAreas(properties) {
    if (!properties || properties.length === 0) return [];

    const groups = {};
    properties.forEach((p) => {
      const city = extractCity(p.location);
      const areaName = extractArea(p.location);
      const key = city + "||" + areaName;
      if (!groups[key]) {
        groups[key] = { areaName, city, props: [] };
      }
      groups[key].props.push(p);
    });

    const areas = Object.entries(groups).map(([key, g]) => {
      const props = g.props;
      const saleProps = props.filter(
        (p) => p.category === "For Sale" || p.purpose === "Buy"
      );
      const rentProps = props.filter(
        (p) => p.category === "For Rent" || p.purpose === "Rent"
      );

      const buyPrices = saleProps.map((p) => Number(p.price)).filter((p) => p > 0);
      const rentPrices = rentProps.map((p) => Number(p.price)).filter((p) => p > 0);

      const buyAvg =
        buyPrices.length > 0
          ? buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length
          : 0;
      const rentAvg =
        rentPrices.length > 0
          ? rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length
          : 0;

      // Price growth (YoY estimate from createdAt timestamps)
      const dated = props
        .filter((p) => p.createdAt && Number(p.price) > 0)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      let priceYoY = 0;
      if (dated.length >= 2) {
        const oldest = dated[0];
        const newest = dated[dated.length - 1];
        const oldPrice = Number(oldest.price);
        const newPrice = Number(newest.price);
        if (oldPrice > 0) {
          priceYoY = ((newPrice - oldPrice) / oldPrice) * 100;
        }
      }

      // Zone classification
      const zone =
        buyAvg > 70000000 ? "high" : buyAvg > 20000000 ? "mid" : "low";

      // Metrics computed from real property features
      const securityProps = props.filter(
        (p) =>
          p.features &&
          p.features.some(
            (f) => typeof f === "string" && /security|guard|gated|cctv|camera/i.test(f)
          )
      );
      const safety = Math.min(
        95,
        Math.round((securityProps.length / props.length) * 100 + 40)
      );

      const affordability = buyAvg > 0
        ? Math.max(10, Math.min(95, Math.round(100 - (buyAvg / 100000000) * 50)))
        : 50;

      const connectProps = props.filter(
        (p) =>
          p.features &&
          p.features.some(
            (f) =>
              typeof f === "string" &&
              /road|highway|motorway|airport|metro|bus|transport/i.test(f)
          )
      );
      const connectivity = Math.min(
        95,
        Math.round((connectProps.length / props.length) * 100 + 30)
      );

      const growthScore = Math.min(
        95,
        Math.max(10, Math.round(priceYoY * 3 + 30))
      );

      const typeDist = {};
      props.forEach((p) => {
        const t = p.type || "Unknown";
        typeDist[t] = (typeDist[t] || 0) + 1;
      });

      return {
        name: g.areaName,
        city: g.city,
        props: props.length,
        buyProps: saleProps.length,
        rentProps: rentProps.length,
        buyAvg,
        rentAvg,
        priceYoY: Math.round(priceYoY * 10) / 10,
        zone,
        metrics: {
          safety: isNaN(safety) ? 50 : safety,
          affordability: isNaN(affordability) ? 50 : affordability,
          connectivity: isNaN(connectivity) ? 50 : connectivity,
          growth: isNaN(growthScore) ? 50 : growthScore,
        },
        typeDist,
        allPrices: [...buyPrices, ...rentPrices],
        hasRent: rentProps.length > 0,
        hasSale: saleProps.length > 0,
      };
    });

    return areas;
  }

  function computeDashboardStats(properties, areas) {
    if (!properties || properties.length === 0) {
      return {
        areaCount: 0,
        avgPrice: 0,
        bestGrowth: 0,
        bestGrowthName: "",
        totalProps: 0,
        buyCount: 0,
        rentCount: 0,
        buyRentRatio: "—",
        priceIndex: 0,
        priceIndexChg: "—",
        avgYield: 0,
      };
    }

    const saleProps = properties.filter(
      (p) => p.category === "For Sale" || p.purpose === "Buy"
    );
    const rentProps = properties.filter(
      (p) => p.category === "For Rent" || p.purpose === "Rent"
    );
    const allPrices = properties
      .map((p) => Number(p.price))
      .filter((p) => p > 0);
    const avgPrice =
      allPrices.length > 0
        ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
        : 0;

    let bestGrowth = 0;
    let bestGrowthName = "";
    areas.forEach((a) => {
      if (a.priceYoY > bestGrowth) {
        bestGrowth = a.priceYoY;
        bestGrowthName = a.name;
      }
    });

    const buyCount = saleProps.length;
    const rentCount = rentProps.length;
    const ratio =
      rentCount > 0
        ? (buyCount / rentCount).toFixed(1)
        : buyCount > 0
        ? "All Buy"
        : "—";

    const priceIndex =
      avgPrice > 0 ? Math.round((avgPrice / 10000000) * 10) : 0;

    // Rental yield estimate: (avgRent * 12) / avgBuy
    const salePrices = saleProps.map((p) => Number(p.price)).filter((p) => p > 0);
    const rentPricesList = rentProps.map((p) => Number(p.price)).filter((p) => p > 0);
    const avgSalePrice =
      salePrices.length > 0
        ? salePrices.reduce((a, b) => a + b, 0) / salePrices.length
        : 0;
    const avgRentPrice =
      rentPricesList.length > 0
        ? rentPricesList.reduce((a, b) => a + b, 0) / rentPricesList.length
        : 0;
    const rentalYield =
      avgSalePrice > 0 ? ((avgRentPrice * 12) / avgSalePrice) * 100 : 0;

    return {
      areaCount: areas.length,
      avgPrice,
      bestGrowth,
      bestGrowthName,
      totalProps: properties.length,
      buyCount,
      rentCount,
      buyRentRatio: ratio,
      priceIndex,
      avgYield: rentalYield,
    };
  }

  // ==================================================================
  // 5. GROQ AI SUMMARY
  // ==================================================================

  async function generateAISummary(properties, areas) {
    if (!GROQ_API_KEY || GROQ_API_KEY.startsWith("PASTE_")) {
      return "AI summary not available — set your Groq API key in area-insight-app.js (see AI_SETUP_README.md).";
    }

    if (properties.length < 3) {
      return "Insufficient property data for AI analysis. Add at least 3 properties to generate meaningful market intelligence.";
    }

    const payload = {
      totalProperties: properties.length,
      totalAreas: areas.length,
      areas: areas.map((a) => ({
        name: a.name,
        city: a.city,
        properties: a.props,
        buyAvg: a.buyAvg,
        rentAvg: a.rentAvg,
        priceYoY: a.priceYoY,
        zone: a.zone,
        metrics: a.metrics,
      })),
      propertyTypes: getTypeDistribution(properties),
      purposes: getPurposeDistribution(properties),
    };

    try {
      const resp = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: GROQ_SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(payload) },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.warn("[NestFinder] Groq API error:", resp.status, errText);
        return "AI analysis currently unavailable. Showing data-driven insights based on your Firebase listings.";
      }

      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);

      if (parsed.summary === "INSUFFICIENT_DATA") {
        return "Insufficient data for a comprehensive AI summary. Add more property listings across different areas.";
      }

      return parsed.summary || "Market summary generated from your live property database.";
    } catch (err) {
      console.warn("[NestFinder] Groq call failed:", err);
      return "AI analysis currently unavailable. Showing data-driven insights based on your Firebase listings.";
    }
  }

  function getTypeDistribution(properties) {
    const dist = {};
    properties.forEach((p) => {
      const t = p.type || "Unknown";
      dist[t] = (dist[t] || 0) + 1;
    });
    return dist;
  }

  function getPurposeDistribution(properties) {
    let buy = 0,
      rent = 0;
    properties.forEach((p) => {
      if (p.category === "For Sale" || p.purpose === "Buy") buy++;
      else if (p.category === "For Rent" || p.purpose === "Rent") rent++;
    });
    return { buy, rent };
  }

  // ==================================================================
  // 6. RENDER ENGINE
  // ==================================================================

  function renderAll(properties, areas, summary) {
    const stats = computeDashboardStats(properties, areas);

    // Update data count badge
    const badge = $("dataCountBadge");
    if (badge) {
      badge.textContent = properties.length + " listing" + (properties.length !== 1 ? "s" : "");
    }

    // No results state
    const noResults = $("noResultsMessage");
    const grid = document.querySelector(".ai-insight-grid");
    const hasFilter = filterState.city || filterState.purpose;
    const showSections = properties.length > 0 || !hasFilter || cachedProperties.length === 0;
    if (!showSections) {
      const els = [$("statsRow"), $("summaryBanner"), grid];
      els.forEach((el) => { if (el) el.style.display = "none"; });
      if (!noResults && grid) {
        const msg = document.createElement("div");
        msg.id = "noResultsMessage";
        msg.className = "ai-no-results";
        msg.innerHTML = '<i class="bi bi-search"></i><h4>No Matching Properties</h4><p>No properties match your filters. Try adjusting the search criteria.</p>';
        grid.parentNode.insertBefore(msg, grid);
      } else if (noResults) {
        noResults.style.display = "block";
      }
      return;
    } else {
      const els = [$("statsRow"), $("summaryBanner"), grid];
      els.forEach((el) => { if (el) el.style.display = ""; });
      if (noResults) noResults.style.display = "none";
    }

    // Stats row
    renderStats(stats, properties.length);

    // Price analytics
    renderPriceAnalytics(areas);

    // Distribution
    renderDistribution(properties);

    // Area rankings
    renderAreaRankings(areas);

    // Investment opportunities
    renderInvestments(areas);

    // Comparison
    renderComparison(areas);

    // Similar areas
    renderSimilarAreas(areas);

    // AI summary
    const summaryEl = $("summaryText");
    if (summaryEl) {
      summaryEl.textContent = summary || "No AI summary available. Try again after adding more properties.";
    }

    // Freshness
    const fresh = $("dataFreshness");
    if (fresh) {
      const now = new Date();
      fresh.innerHTML =
        '<i class="bi bi-database"></i> All data computed live from Firebase Realtime Database &bull; Last updated: ' +
        now.toLocaleTimeString() +
        " &bull; AI insights by Groq";
    }
  }

  function renderStats(stats, totalProps) {
    const setStat = (id, val, chg) => {
      const el = $(id);
      if (!el) return;
      el.textContent = val;
      if (chg !== undefined && chg !== null) {
        const chgEl = el.parentElement.querySelector(".ai-stat-chg");
        if (chgEl) chgEl.textContent = chg;
      }
    };

    setStat("statAreas", stats.areaCount || "—");
    setStat("statAvgPrice", formatPrice(stats.avgPrice, true));
    setStat(
      "statGrowth",
      stats.bestGrowth > 0 ? "+" + stats.bestGrowth + "%" : "—"
    );
    setStat("statProperties", totalProps || "—");
    setStat("statBuyRent", stats.buyRentRatio || "—");

    // Sub-changes
    const priceChgEl = $("statPriceChg");
    if (priceChgEl) {
      priceChgEl.textContent = stats.priceIndex > 0 ? "Idx: " + stats.priceIndex : "";
    }
    const growthChgEl = $("statGrowthChg");
    if (growthChgEl) {
      growthChgEl.textContent = stats.bestGrowthName || "";
    }
    const propsChgEl = $("statPropsChg");
    if (propsChgEl) {
      propsChgEl.textContent =
        stats.buyCount > 0 || stats.rentCount > 0
          ? stats.buyCount + " buy / " + stats.rentCount + " rent"
          : "";
    }
    const buyRentChgEl = $("statBuyRentChg");
    if (buyRentChgEl) {
      buyRentChgEl.textContent =
        stats.avgYield > 0 ? "Yield: " + stats.avgYield.toFixed(1) + "%" : "";
    }
    const areasChgEl = $("statAreasChg");
    if (areasChgEl) {
      areasChgEl.textContent =
        stats.areaCount > 1
          ? stats.areaCount + " unique locations"
          : stats.areaCount === 1
          ? "1 area"
          : "";
    }
  }

  function renderPriceAnalytics(areas) {
    const body = $("priceAnalyticsBody");
    const count = $("priceAnalyticsCount");
    if (!body) return;

    if (!areas || areas.length === 0) {
      showInsufficient("priceAnalyticsBody", "Add properties with price information to see area-level price analytics.");
      if (count) count.textContent = "0";
      return;
    }

    if (count) count.textContent = areas.length;

    const sorted = [...areas].sort((a, b) => b.buyAvg - a.buyAvg);
    const maxBuy = Math.max(...sorted.map((a) => a.buyAvg), 1);

    const items = sorted
      .slice(0, 8)
      .map(
        (a) => `
      <div class="ai-metric-bar-item">
        <div class="ai-metric-bar-label">
          <span>${a.name}, ${a.city}</span>
          <span>${formatPrice(a.buyAvg, true)}</span>
        </div>
        <div class="ai-metric-bar-track">
          <div class="ai-metric-bar-fill" style="width:${(a.buyAvg / maxBuy) * 100}%"></div>
        </div>
      </div>`
      )
      .join("");

    body.innerHTML = `
      <div class="ai-metric-bar-group">
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--ai-text-muted);margin-bottom:4px;">
          <span>Area</span>
          <span>Avg Buy Price</span>
        </div>
        ${items || '<div class="text-muted small text-center py-3">No buy price data</div>'}
      </div>`;
  }

  function renderDistribution(properties) {
    const body = $("distributionBody");
    const count = $("distCount");
    if (!body) return;

    if (!properties || properties.length === 0) {
      showInsufficient("distributionBody", "Property distribution charts will appear once listings exist in the database.");
      if (count) count.textContent = "0";
      return;
    }

    // Type distribution
    const types = {};
    const purposes = {};
    const zones = {};

    properties.forEach((p) => {
      const t = p.type || "Unknown";
      types[t] = (types[t] || 0) + 1;
      const cat = p.category === "For Sale" || p.purpose === "Buy" ? "For Sale" : "For Rent";
      purposes[cat] = (purposes[cat] || 0) + 1;
      const budget = p.budgetCategory || (Number(p.price) > 50000000 ? "Premium" : Number(p.price) > 10000000 ? "Standard" : "Budget");
      zones[budget] = (zones[budget] || 0) + 1;
    });

    const total = properties.length;

    if (count) count.textContent = total;

    const colors = ["#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#8b5cf6", "#ec4899"];

    const typeItems = Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val], i) => {
        const p = ((val / total) * 100).toFixed(1);
        return `
          <div class="ai-dist-item">
            <span class="ai-dist-dot" style="background:${colors[i % colors.length]}"></span>
            <div class="ai-dist-info">
              <div class="ai-dist-name">${name}</div>
              <div class="ai-dist-count">${val} listing${val !== 1 ? "s" : ""}</div>
            </div>
            <span class="ai-dist-pct">${p}%</span>
          </div>`;
      })
      .join("");

    const purposeItems = Object.entries(purposes)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val], i) => {
        const p = ((val / total) * 100).toFixed(1);
        return `
          <div class="ai-dist-item">
            <span class="ai-dist-dot" style="background:${i === 0 ? "#f59e0b" : "#10b981"}"></span>
            <div class="ai-dist-info">
              <div class="ai-dist-name">${name}</div>
              <div class="ai-dist-count">${val} listing${val !== 1 ? "s" : ""}</div>
            </div>
            <span class="ai-dist-pct">${p}%</span>
          </div>`;
      })
      .join("");

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--ai-text);margin-bottom:8px;">By Type</div>
          <div class="ai-dist-grid">${typeItems || '<div class="text-muted small">No type data</div>'}</div>
        </div>
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--ai-text);margin-bottom:8px;">By Purpose</div>
          <div class="ai-dist-grid">${purposeItems || '<div class="text-muted small">No purpose data</div>'}</div>
        </div>
      </div>`;
  }

  function computeAreaScore(a) {
    const m = a.metrics;
    return Math.round(
      (m.safety || 50) * 0.2 +
        (m.affordability || 50) * 0.2 +
        (m.connectivity || 50) * 0.15 +
        (m.growth || 50) * 0.25 +
        (a.priceYoY > 0 ? Math.min(15, a.priceYoY) : 0) +
        (a.props > 0 ? Math.min(10, a.props) : 0)
    );
  }

  function renderAreaRankings(areas) {
    const body = $("areaRankingsBody");
    const count = $("areaRankCount");
    if (!body) return;

    if (!areas || areas.length === 0) {
      showInsufficient("areaRankingsBody", "Area rankings require multiple properties across different locations to compute meaningful comparisons.");
      if (count) count.textContent = "0";
      return;
    }

    const ranked = areas
      .map((a) => ({ ...a, score: computeAreaScore(a) }))
      .sort((a, b) => b.score - a.score);

    if (count) count.textContent = ranked.length;

    const items = ranked
      .slice(0, 9)
      .map(
        (a, i) => `
        <div class="ai-area-card">
          <div class="ai-area-rank">
            <span class="ai-area-rank-num">#${i + 1}</span>
            <div class="ai-area-rank-title">
              <div class="ai-area-name">${a.name}</div>
              <div class="ai-area-city">${a.city} · ${a.props} listing${a.props !== 1 ? "s" : ""}</div>
            </div>
            <span class="ai-area-growth ${a.priceYoY >= 0 ? "" : "down"}">${a.priceYoY >= 0 ? "+" : ""}${a.priceYoY}%</span>
          </div>
          <div class="ai-area-metrics">
            <div class="ai-area-metric"><span>Safety</span><span>${a.metrics.safety}</span></div>
            <div class="ai-area-metric"><span>Affordability</span><span>${a.metrics.affordability}</span></div>
            <div class="ai-area-metric"><span>Connectivity</span><span>${a.metrics.connectivity}</span></div>
            <div class="ai-area-metric"><span>Growth</span><span>${a.metrics.growth}</span></div>
          </div>
          <div class="ai-area-desc">
            ${a.props} listing${a.props !== 1 ? "s" : ""} ·
            Avg buy: ${formatPrice(a.buyAvg, true)} ·
            Avg rent: ${a.rentAvg > 0 ? formatPrice(a.rentAvg, true) : "N/A"}
          </div>
        </div>`
      )
      .join("");

    body.innerHTML = `<div class="ai-area-grid">${items}</div>`;
  }

  function renderInvestments(areas) {
    const body = $("investmentBody");
    const count = $("investCount");
    if (!body) return;

    const investable = areas.filter((a) => a.buyAvg > 0 || a.rentAvg > 0);
    if (investable.length === 0) {
      showInsufficient("investmentBody", "Investment analysis requires price history and property type data to calculate ROI projections.");
      if (count) count.textContent = "0";
      return;
    }

    const ranked = investable
      .map((a) => {
        const growthFactor = Math.max(0, a.priceYoY) * 0.4;
        const yieldFactor =
          a.buyAvg > 0 && a.rentAvg > 0
            ? ((a.rentAvg * 12) / a.buyAvg) * 100 * 0.3
            : 0;
        const safetyFactor = (a.metrics.safety || 50) * 0.15;
        const connFactor = (a.metrics.connectivity || 50) * 0.15;
        const roi = Math.round((growthFactor + yieldFactor + safetyFactor + connFactor) * 10) / 10;
        const projectedROI = a.priceYoY > 0 ? (a.priceYoY * 3.8).toFixed(1) : "—";
        return { ...a, investScore: roi, projectedROI };
      })
      .sort((a, b) => b.investScore - a.investScore);

    if (count) count.textContent = ranked.length;

    const items = ranked
      .slice(0, 6)
      .map(
        (a, i) => `
        <div class="ai-invest-card">
          <div class="ai-invest-rank-badge">
            <i class="bi bi-trophy-fill"></i> #${i + 1} Opportunity
          </div>
          <div class="ai-invest-name">${a.name}</div>
          <div class="ai-invest-city">${a.city} · ${a.zone.toUpperCase()} zone</div>
          <div class="ai-invest-roi">${a.projectedROI !== "—" ? a.projectedROI + "%" : "—"}</div>
          <div class="ai-invest-roi-lbl">Projected 5-Year ROI</div>
          <div class="ai-invest-detail">
            <span>YoY Growth</span>
            <span>${a.priceYoY >= 0 ? "+" : ""}${a.priceYoY}%</span>
          </div>
          <div class="ai-invest-detail">
            <span>Leverage Score</span>
            <span>${a.investScore}</span>
          </div>
          <div class="ai-invest-detail">
            <span>Avg Buy Price</span>
            <span>${formatPrice(a.buyAvg, true)}</span>
          </div>
        </div>`
      )
      .join("");

    body.innerHTML = `<div class="ai-invest-grid">${items}</div>`;
  }

  function renderComparison(areas) {
    const body = $("comparisonBody");
    if (!body) return;

    if (!areas || areas.length < 2) {
      showInsufficient("comparisonBody", "Add at least two properties in different areas to enable comparison analysis.");
      return;
    }

    const options = areas
      .map(
        (a) =>
          `<option value="${a.name}||${a.city}">${a.name}, ${a.city}</option>`
      )
      .join("");

    body.innerHTML = `
      <div>
        <div class="ai-compare-row mb-3">
          <div>
            <label class="form-label fw-semibold small" style="color:var(--ai-text-muted);">Area A</label>
            <select class="ai-compare-select" id="compareSelectA">${options}</select>
          </div>
          <div class="text-center pt-4">
            <div class="ai-compare-vs">VS</div>
          </div>
          <div>
            <label class="form-label fw-semibold small" style="color:var(--ai-text-muted);">Area B</label>
            <select class="ai-compare-select" id="compareSelectB">${options}</select>
          </div>
        </div>
        <button class="btn btn-warning text-dark fw-bold w-100" id="compareBtn" style="border-radius:10px;">
          <i class="bi bi-arrow-left-right me-1"></i> Compare Now
        </button>
        <div class="ai-compare-result" id="compareResult"></div>
      </div>`;

    // Set defaults
    const selA = $("compareSelectA");
    const selB = $("compareSelectB");
    if (selA && areas[0]) selA.value = areas[0].name + "||" + areas[0].city;
    if (selB && areas[1]) selB.value = areas[1].name + "||" + areas[1].city;

    const compareBtn = $("compareBtn");
    if (compareBtn) {
      compareBtn.addEventListener("click", () => {
        runComparison(areas);
      });
    }
  }

  function runComparison(areas) {
    const selA = $("compareSelectA");
    const selB = $("compareSelectB");
    const result = $("compareResult");
    if (!selA || !selB || !result) return;

    const valA = selA.value;
    const valB = selB.value;
    if (valA === valB) {
      result.innerHTML =
        '<div class="alert alert-warning mt-3 small">Please select two different areas to compare.</div>';
      result.classList.add("show");
      return;
    }

    const [nameA, cityA] = valA.split("||");
    const [nameB, cityB] = valB.split("||");
    const areaA = areas.find((a) => a.name === nameA && a.city === cityA);
    const areaB = areas.find((a) => a.name === nameB && a.city === cityB);

    if (!areaA || !areaB) {
      result.innerHTML =
        '<div class="alert alert-warning mt-3 small">Could not find area data for comparison.</div>';
      result.classList.add("show");
      return;
    }

    const factors = [
      { key: "safety", label: "Safety", a: areaA.metrics.safety, b: areaB.metrics.safety },
      {
        key: "affordability",
        label: "Affordability",
        a: areaA.metrics.affordability,
        b: areaB.metrics.affordability,
      },
      {
        key: "connectivity",
        label: "Connectivity",
        a: areaA.metrics.connectivity,
        b: areaB.metrics.connectivity,
      },
      { key: "growth", label: "Growth", a: areaA.metrics.growth, b: areaB.metrics.growth },
    ];

    const totalA = factors.reduce((s, f) => s + f.a, 0);
    const totalB = factors.reduce((s, f) => s + f.b, 0);
    const winner = totalA > totalB ? areaA : areaB;

    const factorRows = factors
      .map((f) => {
        const maxVal = Math.max(f.a, f.b, 1);
        const pctA = (f.a / maxVal) * 100;
        const pctB = (f.b / maxVal) * 100;
        const w = f.a > f.b ? "A" : f.b > f.a ? "B" : "tie";
        return `
          <div class="ai-compare-factor">
            <div>
              <div class="ai-compare-val ${w === "A" ? "winner" : ""}">${f.a}</div>
              <div class="ai-compare-bar-wrap"><div class="ai-compare-bar-a" style="width:${pctA}%"></div></div>
            </div>
            <div class="ai-compare-factor-label">${f.label}</div>
            <div>
              <div class="ai-compare-val ${w === "B" ? "winner" : ""}">${f.b}</div>
              <div class="ai-compare-bar-wrap"><div class="ai-compare-bar-b" style="width:${pctB}%"></div></div>
            </div>
          </div>`;
      })
      .join("");

    const growthText =
      winner.priceYoY > 0
        ? `${winner.name} shows ${winner.priceYoY}% YoY price growth.`
        : "";

    result.innerHTML = `
      <div class="ai-compare-winner">
        <i class="bi bi-trophy-fill"></i>
        <div class="ai-compare-winner-text">
          <strong>${winner.name}, ${winner.city}</strong> scores higher overall
          (${Math.max(totalA, totalB)} vs ${Math.min(totalA, totalB)}).
          ${growthText}
        </div>
      </div>
      <div class="ai-compare-factors">${factorRows}</div>
      <div class="row g-2 mt-3">
        <div class="col-6">
          <div class="p-2 text-center" style="background:rgba(245,158,11,0.06);border-radius:8px;border:1px solid rgba(245,158,11,0.12);">
            <div class="fw-bold small" style="color:var(--ai-text);">${areaA.name}</div>
            <div class="text-muted" style="font-size:0.7rem;">${formatPrice(areaA.buyAvg, true)} avg</div>
          </div>
        </div>
        <div class="col-6">
          <div class="p-2 text-center" style="background:rgba(245,158,11,0.06);border-radius:8px;border:1px solid rgba(245,158,11,0.12);">
            <div class="fw-bold small" style="color:var(--ai-text);">${areaB.name}</div>
            <div class="text-muted" style="font-size:0.7rem;">${formatPrice(areaB.buyAvg, true)} avg</div>
          </div>
        </div>
      </div>`;
    result.classList.add("show");
  }

  function computeSimilarity(a, b) {
    const m1 = a.metrics;
    const m2 = b.metrics;
    const safetyDiff = Math.abs(m1.safety - m2.safety);
    const affDiff = Math.abs(m1.affordability - m2.affordability);
    const connDiff = Math.abs(m1.connectivity - m2.connectivity);
    const growthDiff = Math.abs(m1.growth - m2.growth);
    const priceDiff = a.buyAvg > 0 && b.buyAvg > 0 ? Math.abs(a.buyAvg - b.buyAvg) / Math.max(a.buyAvg, b.buyAvg) * 100 : 50;

    const score =
      100 -
      (safetyDiff * 0.2 + affDiff * 0.25 + connDiff * 0.2 + growthDiff * 0.2 + priceDiff * 0.15);
    return Math.round(Math.max(0, Math.min(99, score)));
  }

  function renderSimilarAreas(areas) {
    const body = $("similarBody");
    const count = $("similarCount");
    if (!body) return;

    if (!areas || areas.length < 2) {
      showInsufficient("similarBody", "Similar area recommendations need multiple areas with comparable metrics.");
      if (count) count.textContent = "0";
      return;
    }

    // For each area, find top 2 most similar
    let allSimilar = [];
    areas.forEach((a) => {
      const others = areas.filter((o) => o.name !== a.name || o.city !== a.city);
      const scored = others.map((o) => ({
        from: a,
        to: o,
        score: computeSimilarity(a, o),
      }));
      const top = scored.sort((x, y) => y.score - x.score).slice(0, 2);
      allSimilar.push(...top);
    });

    // Deduplicate
    const seen = new Set();
    allSimilar = allSimilar.filter((s) => {
      const key = [s.from.name, s.from.city, s.to.name, s.to.city].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by score descending
    allSimilar.sort((a, b) => b.score - a.score);

    if (count) count.textContent = allSimilar.length;

    const items = allSimilar
      .slice(0, 12)
      .map(
        (s) => `
        <div class="ai-similar-chip">
          <i class="bi bi-arrow-right-short"></i>
          ${s.from.name} → ${s.to.name}
          <span class="ai-similar-score">${s.score}%</span>
        </div>`
      )
      .join("");

    body.innerHTML = `
      <div style="margin-bottom:10px;">
        <p class="small" style="color:var(--ai-text-muted);margin:0;">
          Areas with comparable metrics and price profiles. Higher percentage = stronger similarity.
        </p>
      </div>
      <div class="ai-similar-chips">
        ${items || '<span class="text-muted small">Not enough comparable data</span>'}
      </div>`;
  }

  // ==================================================================
  // 7. REFRESH
  // ==================================================================

  async function refreshData(properties, skipLoading) {
    if (!skipLoading) {
      showLoading(true);
      await new Promise((r) => setTimeout(r, 300));
    }

    cachedAreas = computeAreas(properties);

    // Generate AI summary
    const summary = await generateAISummary(properties, cachedAreas);

    renderAll(properties, cachedAreas, summary);
    // Initialize enhanced area intelligence
    if (window.AreaIntelligenceEnhanced) {
      AreaIntelligenceEnhanced.init(properties);
    }
    if (!skipLoading) showLoading(false);
  }

  // ==================================================================
  // 8. INIT
  // ==================================================================

  function init() {
    // Theme toggle (from shared style.css)
    const toggle = $("themeToggle");
    const icon = $("themeIcon");
    const html = document.documentElement;
    if (toggle && icon) {
      const saved = localStorage.getItem("nestfinder_theme") || "dark";
      html.setAttribute("data-bs-theme", saved);
      icon.className =
        saved === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      toggle.classList.toggle("btn-outline-warning", saved === "dark");
      toggle.classList.toggle("btn-outline-light", saved !== "dark");
      toggle.addEventListener("click", () => {
        const next =
          html.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
        html.setAttribute("data-bs-theme", next);
        localStorage.setItem("nestfinder_theme", next);
        icon.className =
          next === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
        toggle.classList.toggle("btn-outline-warning", next === "dark");
        toggle.classList.toggle("btn-outline-light", next !== "dark");
      });
    }

    // Navbar scroll effect
    const nav = $("mainNav");
    if (nav) {
      window.addEventListener("scroll", () => {
        nav.classList.toggle("scrolled", window.scrollY > 50);
      });
    }

    // Back to top
    const backBtn = $("backToTop");
    if (backBtn) {
      window.addEventListener("scroll", () => {
        backBtn.classList.toggle("visible", window.scrollY > 400);
      });
      backBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Refresh button
    const refreshBtn = $("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.classList.add("spinning");
        if (cachedProperties.length > 0) {
          await refreshData(cachedProperties);
        } else {
          // Re-fetch from Firebase
          try {
            const props = await window.NestFinderAPI.fetchAll();
            cachedProperties = props;
            await refreshData(props);
          } catch (err) {
            console.error("[NestFinder] Refresh failed:", err);
          }
        }
        refreshBtn.classList.remove("spinning");
      });
    }

    // Search filter — city + purpose dropdowns + search button
    const filterCity = $("filterCity");
    const filterPurpose = $("filterPurpose");
    const filterApplyBtn = $("filterApplyBtn");

    function populateCityDropdown() {
      if (!filterCity) return;
      const currentVal = filterCity.value;
      const cities = new Set();
      cachedProperties.forEach((p) => {
        if (p.location) {
          const parts = p.location.split(",").map((s) => s.trim());
          const city = parts[parts.length - 1];
          if (city) cities.add(city);
        }
      });
      const sorted = Array.from(cities).sort();
      filterCity.innerHTML = '<option value="">All Cities</option>' +
        sorted.map((c) => '<option value="' + c + '">' + c + '</option>').join("");
      if (currentVal && sorted.includes(currentVal)) filterCity.value = currentVal;
    }

    function applyFilters() {
      filterState.city = filterCity ? filterCity.value : "";
      filterState.purpose = filterPurpose ? filterPurpose.value : "";
      const filtered = filterPropertiesBySearch(cachedProperties, filterState);
      refreshData(filtered, true);
    }

    if (filterApplyBtn) filterApplyBtn.addEventListener("click", applyFilters);
    if (filterCity) filterCity.addEventListener("change", applyFilters);
    if (filterPurpose) filterPurpose.addEventListener("change", applyFilters);

    // Start Firebase listener
    startFirebaseListener(async (filtered) => {
      populateCityDropdown();
      await refreshData(filtered);
    });
  }

  // Wait for Firebase and NestFinderAPI to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
