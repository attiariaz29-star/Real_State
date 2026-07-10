/**
 * NESTFINDER AI RECOMMENDATIONS – 100% FIREBASE-POWERED APP CONTROLLER
 * 
 * All data comes from Firebase Realtime Database:
 * - Properties are loaded from seller-uploaded listings
 * - Area database is built dynamically from property locations
 * - Market insights are calculated from real listing data
 * - AI scores are computed by the Groq AI backend
 * 
 * No mock data. No dummy listings. No fake statistics.
 */
console.log("[NestFinder] 100% Firebase-powered AI Recommendations v3.0");

document.addEventListener("DOMContentLoaded", async () => {
  // ========================================================================
  // 1. DATA SOURCES — Everything comes from Firebase
  // ========================================================================

  // NestFinderAPI connects to Firebase Realtime Database
  const API = window.NestFinderAPI;
  if (!API) {
    console.error("[NestFinder] NestFinderAPI not loaded. Firebase connection unavailable.");
    showFatalError("Unable to connect to the database. Please refresh the page.");
    return;
  }

  // AIEngine handles Groq AI calls (server-side via Cloud Functions)
  const AIEngine = window.NestFinderAI?.AIEngine;

  // These will be built from Firebase data, not hardcoded
  let AREA_DATABASE = [];
  let AI_PROPERTIES = [];
  let MARKET_INSIGHTS = {};

  // ========================================================================
  // 2. DYNAMIC DATA BUILDERS — Build everything from Firebase properties
  // ========================================================================

  /**
   * Build AREA_DATABASE from Firebase properties.
   * Groups properties by location city and computes real metrics.
   */
  function buildAreaDatabase(properties) {
    if (!properties || properties.length === 0) return [];

    // Group properties by city (extracted from location field)
    const cityGroups = {};
    properties.forEach(p => {
      const city = extractCity(p.location);
      if (!city) return;
      if (!cityGroups[city]) {
        cityGroups[city] = [];
      }
      cityGroups[city].push(p);
    });

    const areas = [];
    let areaId = 1;

    Object.entries(cityGroups).forEach(([city, props]) => {
      // Further group by area/location within city
      const locationGroups = {};
      props.forEach(p => {
        const areaName = extractAreaName(p.location);
        if (!locationGroups[areaName]) {
          locationGroups[areaName] = [];
        }
        locationGroups[areaName].push(p);
      });

      Object.entries(locationGroups).forEach(([areaName, areaProps]) => {
        const saleProps = areaProps.filter(p => p.category === "For Sale" || p.purpose === "Buy");
        const rentProps = areaProps.filter(p => p.category === "For Rent" || p.purpose === "Rent");

        const buyPrices = saleProps.map(p => p.price).filter(p => p > 0);
        const rentPrices = rentProps.map(p => p.price).filter(p => p > 0);

        const buyAvg = buyPrices.length > 0 ? buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length : 0;
        const rentAvg = rentPrices.length > 0 ? rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length : 0;

        // Calculate price YoY growth from createdAt timestamps
        const priceYoY = calculatePriceGrowth(areaProps);

        // Determine zone based on average buy price
        const zone = buyAvg > 70000000 ? "high" : buyAvg > 20000000 ? "mid" : "low";

        // Calculate metrics from property features and data
        const metrics = calculateAreaMetrics(areaProps);

        // Find a representative image
        const image = areaProps.find(p => p.image)?.image || 
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

        areas.push({
          id: `area_${areaId++}`,
          name: areaName,
          city: city,
          description: generateAreaDescription(areaName, city, areaProps),
          priceYoY: priceYoY,
          buyAvg: buyAvg,
          rentAvg: rentAvg,
          zone: zone,
          properties: areaProps.length,
          trending: priceYoY > 10,
          image: image,
          metrics: metrics,
          // AI-populated fields
          _aiMatchScore: 0,
          _aiMatchReason: ""
        });
      });
    });

    return areas;
  }

  /**
   * Extract city from location string (e.g. "DHA Phase 6, Karachi" -> "Karachi")
   */
  function extractCity(location) {
    if (!location) return "Unknown";
    const parts = location.split(",").map(s => s.trim());
    return parts[parts.length - 1] || "Unknown";
  }

  /**
   * Extract area name from location string (e.g. "DHA Phase 6, Karachi" -> "DHA Phase 6")
   */
  function extractAreaName(location) {
    if (!location) return "Unknown Area";
    const parts = location.split(",").map(s => s.trim());
    return parts[0] || "Unknown Area";
  }

  /**
   * Calculate price growth year-over-year from property timestamps
   */
  function calculatePriceGrowth(properties) {
    if (!properties || properties.length < 2) return 0;

    // Sort by creation date
    const sorted = [...properties]
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (sorted.length < 2) return 0;

    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    if (!oldest.price || !newest.price || oldest.price === 0) return 0;

    const growth = ((newest.price - oldest.price) / oldest.price) * 100;
    return Math.round(growth * 10) / 10;
  }

  /**
   * Calculate area metrics from property data
   */
  function calculateAreaMetrics(properties) {
    const count = properties.length;
    if (count === 0) {
      return { safety: 50, affordability: 50, connectivity: 50, growth: 50 };
    }

    // Safety: based on features mentioning security
    const securityProps = properties.filter(p => 
      (p.features || []).some(f => 
        /security|guard|gated|cctv|camera/i.test(f)
      )
    );
    const safety = Math.min(95, Math.round((securityProps.length / count) * 100) + 40);

    // Affordability: inverse of average price (lower price = higher score)
    const prices = properties.map(p => p.price).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const affordability = avgPrice > 0 
      ? Math.max(10, Math.min(95, Math.round(100 - (avgPrice / 100000000) * 50)))
      : 50;

    // Connectivity: based on features mentioning transport/roads
    const connectProps = properties.filter(p =>
      (p.features || []).some(f =>
        /road|highway|motorway|airport|metro|bus|transport/i.test(f)
      )
    );
    const connectivity = Math.min(95, Math.round((connectProps.length / count) * 100) + 30);

    // Growth: based on priceYoY
    const growth = calculatePriceGrowth(properties);
    const growthScore = Math.min(95, Math.max(10, Math.round(growth * 3) + 30));

    return {
      safety: safety,
      affordability: affordability,
      connectivity: connectivity,
      growth: growthScore
    };
  }

  /**
   * Generate a description for an area based on its properties
   */
  function generateAreaDescription(areaName, city, properties) {
    const count = properties.length;
    const types = [...new Set(properties.map(p => p.type))];
    const categories = [...new Set(properties.map(p => p.category || p.purpose))];

    let desc = `${areaName} in ${city} has ${count} active listing${count !== 1 ? 's' : ''}`;
    if (types.length > 0) {
      desc += ` including ${types.join(", ")} properties`;
    }
    if (categories.length > 0) {
      const catStr = categories.map(c => c === "For Sale" || c === "Buy" ? "for sale" : "for rent").join(" and ");
      desc += ` ${catStr}`;
    }
    desc += ".";
    return desc;
  }

  /**
   * Build AI_PROPERTIES from Firebase properties
   */
  function buildAIProperties(properties) {
    if (!properties) return [];

    return properties.map(p => ({
      id: String(p.id),
      budget: p.budgetCategory === "Luxury" ? "premium" : p.budgetCategory === "Premium" ? "mid" : "budget",
      title: p.title,
      area: null, // Will be linked to AREA_DATABASE entry
      areaName: p.location,
      price: p.price || 0,
      priceDisplay: formatPrice(p.price, p.category),
      purpose: p.category === "For Rent" ? "Rent" : "Buy",
      type: p.type,
      beds: p.bedrooms || 0,
      baths: p.bathrooms || 0,
      size: p.area || "N/A",
      image: p.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      aiScore: 0,
      aiReason: "",
      features: p.features && p.features.length ? p.features : [],
      tags: p.status === "Active" && p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000) 
        ? ["New Listing"] 
        : []
    }));
  }

  /**
   * Build MARKET_INSIGHTS from Firebase properties
   */
  function buildMarketInsights(properties, areas) {
    if (!properties || properties.length === 0) {
      return {
        quarterlyReport: "No market data available yet. Listings will appear here once sellers add properties.",
        stats: null
      };
    }

    const saleProps = properties.filter(p => p.category === "For Sale" || p.purpose === "Buy");
    const rentProps = properties.filter(p => p.category === "For Rent" || p.purpose === "Rent");

    const salePrices = saleProps.map(p => p.price).filter(p => p > 0);
    const rentPrices = rentProps.map(p => p.price).filter(p => p > 0);

    const avgSalePrice = salePrices.length > 0 ? salePrices.reduce((a, b) => a + b, 0) / salePrices.length : 0;
    const avgRentPrice = rentPrices.length > 0 ? rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length : 0;

    // Calculate rental yield
    const rentalYield = avgSalePrice > 0 ? ((avgRentPrice * 12) / avgSalePrice) * 100 : 0;

    // Find best growing area
    const bestArea = areas.length > 0 
      ? areas.reduce((a, b) => a.priceYoY > b.priceYoY ? a : b)
      : null;

    // Calculate buy vs rent ratio
    const buyCount = saleProps.length;
    const rentCount = rentProps.length;

    // Property type distribution
    const typeDist = {};
    properties.forEach(p => {
      typeDist[p.type] = (typeDist[p.type] || 0) + 1;
    });
    const topType = Object.entries(typeDist).sort((a, b) => b[1] - a[1])[0];

    // Calculate price index (normalized to base 100)
    const priceIndex = avgSalePrice > 0 ? Math.round((avgSalePrice / 10000000) * 10) : 0;

    // Generate quarterly report text
    const report = generateMarketReport(properties, areas, avgSalePrice, avgRentPrice, rentalYield, bestArea);

    return {
      quarterlyReport: report,
      stats: {
        priceIndex: priceIndex > 0 ? priceIndex.toFixed(1) : "—",
        priceIndexChg: bestArea ? `+${bestArea.priceYoY}%` : "—",
        avgYield: rentalYield > 0 ? rentalYield.toFixed(1) + "%" : "—",
        avgYieldChg: "—",
        avgDays: "—", // Would need listing duration data
        avgDaysChg: "—",
        demandIndex: properties.length > 0 ? Math.min(100, properties.length * 5) : "—",
        demandSentiment: properties.length > 10 ? "Bullish ↑" : properties.length > 5 ? "Stable →" : "Low →",
        marketSentiment: bestArea && bestArea.priceYoY > 15 ? "Bullish" : bestArea && bestArea.priceYoY > 5 ? "Stable" : "Neutral",
        bestAreaGrowth: bestArea ? `+${bestArea.priceYoY}%` : "—",
        fiveYearIRR: rentalYield > 0 ? (rentalYield * 4.5).toFixed(1) + "%" : "—"
      }
    };
  }

  /**
   * Generate natural language market report from real data
   */
  function generateMarketReport(properties, areas, avgSalePrice, avgRentPrice, rentalYield, bestArea) {
    const count = properties.length;
    const saleCount = properties.filter(p => p.category === "For Sale" || p.purpose === "Buy").length;
    const rentCount = properties.filter(p => p.category === "For Rent" || p.purpose === "Rent").length;

    let report = `The NestFinder database currently holds ${count} active listing${count !== 1 ? 's' : ''}`;
    report += ` across ${areas.length} area${areas.length !== 1 ? 's' : ''}`;

    if (saleCount > 0 && rentCount > 0) {
      report += `, with ${saleCount} for sale and ${rentCount} for rent`;
    }
    report += ". ";

    if (avgSalePrice > 0) {
      report += `The average listing price is ${formatPrice(avgSalePrice, "For Sale")}. `;
    }

    if (rentalYield > 0) {
      report += `Estimated rental yield is ${rentalYield.toFixed(1)}%. `;
    }

    if (bestArea && bestArea.priceYoY > 0) {
      report += `${bestArea.name} shows the strongest growth at +${bestArea.priceYoY}% year-over-year. `;
    }

    report += "All figures are calculated live from seller-uploaded listings in the NestFinder database.";

    return report;
  }

  /**
   * Format price for display
   */
  function formatPrice(n, category) {
    if (!n || n === 0) return "Price on Request";
    if (category === "For Rent" || category === "Rent") {
      return n >= 100000 
        ? "PKR " + (n / 100000).toFixed(1) + " Lakh/mo"
        : "PKR " + n.toLocaleString() + "/mo";
    } else {
      return n >= 10000000
        ? "PKR " + (n / 10000000).toFixed(2) + " Crore"
        : "PKR " + (n / 100000).toFixed(1) + " Lakh";
    }
  }

  // ========================================================================
  // 3. INITIAL DATA LOAD — Fetch from Firebase and build everything
  // ========================================================================

  let prefs = { purpose: "buy", lifestyle: "family", budget: "mid" };
  let currentTips = [];
  let currentCommentary = "";
  let aiOnline = true;
  let firebaseProperties = [];

  async function initializeData() {
    try {
      firebaseProperties = (await API.fetchAll()).filter(function(p) { return p.status !== 'Disabled'; });
      console.log(`[NestFinder] Loaded ${firebaseProperties.length} properties from Firebase`);

      // Build all data structures from Firebase
      AREA_DATABASE = buildAreaDatabase(firebaseProperties);
      AI_PROPERTIES = buildAIProperties(firebaseProperties);
      MARKET_INSIGHTS = buildMarketInsights(firebaseProperties, AREA_DATABASE);

      // Link AI properties to area database entries
      AI_PROPERTIES.forEach(p => {
        const area = AREA_DATABASE.find(a => 
          p.areaName.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(p.areaName.toLowerCase())
        );
        if (area) {
          p.area = area.id;
        }
      });

      console.log(`[NestFinder] Built ${AREA_DATABASE.length} areas, ${AI_PROPERTIES.length} AI properties`);
    } catch (err) {
      console.error("[NestFinder] Failed to load from Firebase:", err);
      firebaseProperties = [];
      AREA_DATABASE = [];
      AI_PROPERTIES = [];
      MARKET_INSIGHTS = {
        quarterlyReport: "Unable to load data. Please check your connection and try again.",
        stats: null
      };
    }
  }

  // ========================================================================
  // 4. UI HELPERS
  // ========================================================================

  const $ = id => document.getElementById(id);
  const fmt = n => n >= 10000000
    ? "PKR " + (n / 10000000).toFixed(2) + " Cr"
    : n >= 100000
    ? "PKR " + (n / 100000).toFixed(0) + " L"
    : "PKR " + n.toLocaleString() + "/mo";

  function showFatalError(msg) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;padding:2rem;text-align:center;">
        <i class="bi bi-exclamation-triangle-fill" style="font-size:3rem;color:#f59e0b;margin-bottom:1rem;"></i>
        <h2 style="color:#333;margin-bottom:0.5rem;">Something Went Wrong</h2>
        <p style="color:#666;max-width:400px;">${msg}</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:8px;color:#000;font-weight:700;cursor:pointer;">
          <i class="bi bi-arrow-clockwise me-2"></i>Reload Page
        </button>
      </div>
    `;
  }

  // ========================================================================
  // 5. BACK TO TOP
  // ========================================================================

  function initBackToTop() {
    const btn = $("backToTop");
    window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // ========================================================================
  // 6. AI STATUS BANNER
  // ========================================================================

  function showAIStatus(online) {
    aiOnline = online;
    let banner = $("aiStatusBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "aiStatusBanner";
      banner.className = "alert alert-warning text-center small mt-3 mb-0 d-none";
      banner.setAttribute("role", "alert");
      const wizard = $("prefWizard");
      if (wizard && wizard.parentNode) {
        wizard.parentNode.insertBefore(banner, wizard.nextSibling);
      }
    }
    if (online) {
      banner.classList.add("d-none");
    } else {
      banner.classList.remove("d-none");
      banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i>AI analysis is currently unavailable. Showing data-driven estimates based on your Firebase listings. <button type="button" class="btn btn-sm btn-outline-dark ms-2" id="aiRetryBtn">Retry</button>`;
      const retryBtn = $("aiRetryBtn");
      if (retryBtn) retryBtn.addEventListener("click", () => showLoading(() => runAnalysis(prefs)));
    }
  }

  // ========================================================================
  // 7. AI ANALYSIS — Calls Groq backend, falls back to data-driven estimates
  // ========================================================================

  async function runAnalysis(activePrefs) {
    if (!AIEngine) {
      console.warn("[NestFinder] AIEngine not available. Using data-driven estimates.");
      applyDataDrivenScores(activePrefs);
      currentTips = generateDataDrivenTips(activePrefs);
      currentCommentary = MARKET_INSIGHTS.quarterlyReport;
      showAIStatus(false);
      return;
    }

    try {
      const analysis = await AIEngine.analyze(activePrefs, AREA_DATABASE, AI_PROPERTIES);

      AREA_DATABASE.forEach(area => {
        const m = analysis.areaMatches?.get?.(String(area.id));
        if (m) {
          area._aiMatchScore = m.matchScore;
          area._aiMatchReason = m.reason;
        }
      });

      AI_PROPERTIES.forEach(p => {
        const s = analysis.propertyScores?.get?.(String(p.id));
        if (s) {
          p.aiScore = s.aiScore;
          p.aiReason = s.aiReason;
        }
      });

      currentTips = analysis.tips || [];
      currentCommentary = analysis.marketCommentary || MARKET_INSIGHTS.quarterlyReport;
      showAIStatus(true);
    } catch (err) {
      console.error("[NestFinder] AI analysis failed:", err);
      applyDataDrivenScores(activePrefs);
      currentTips = generateDataDrivenTips(activePrefs);
      currentCommentary = MARKET_INSIGHTS.quarterlyReport;
      showAIStatus(false);
    }
  }

  /**
   * Apply data-driven scores when AI backend is unavailable.
   * Uses real Firebase data, not fake data.
   */
  function applyDataDrivenScores(activePrefs) {
    AREA_DATABASE.forEach(area => {
      let score = 50;
      const m = area.metrics;

      // Base score from metrics
      score = (m.safety * 0.2) + (m.affordability * 0.2) + (m.connectivity * 0.15) + (m.growth * 0.25) + 20;

      // Adjust for budget preference
      if (activePrefs.budget === "budget" && area.zone === "low") score += 15;
      if (activePrefs.budget === "premium" && area.zone === "mid") score += 10;
      if (activePrefs.budget === "premium" && area.zone === "high") score += 15;

      // Adjust for purpose
      if (activePrefs.purpose === "rent" && area.rentAvg > 0) score += 5;
      if (activePrefs.purpose === "buy" && area.buyAvg > 0) score += 5;

      area._aiMatchScore = Math.min(98, Math.max(20, Math.round(score)));
      area._aiMatchReason = generateDataDrivenReason(area, activePrefs);
    });

    AI_PROPERTIES.forEach(p => {
      let score = 60;

      // Adjust for budget match
      if (activePrefs.budget === p.budget) score += 15;
      else if (activePrefs.budget === "mid" && p.budget === "budget") score += 5;

      // Adjust for purpose match
      if (activePrefs.purpose.toLowerCase() === (p.purpose || "").toLowerCase()) score += 15;

      // Adjust for lifestyle
      if (activePrefs.lifestyle === "family" && (p.beds || 0) >= 3) score += 10;
      if (activePrefs.lifestyle === "student" && (p.beds || 0) <= 2) score += 10;
      if (activePrefs.lifestyle === "premium" && p.budget === "premium") score += 15;
      if (activePrefs.lifestyle === "investment" && p.budget === "mid") score += 5;

      p.aiScore = Math.min(98, Math.max(30, Math.round(score)));
      p.aiReason = generatePropertyReason(p, activePrefs);
    });
  }

  function generateDataDrivenReason(area, prefs) {
    const parts = [];
    if (area.metrics.growth > 60) parts.push("strong growth potential");
    if (area.metrics.safety > 60) parts.push("good security profile");
    if (area.metrics.connectivity > 60) parts.push("well-connected location");
    if (prefs.budget === "budget" && area.zone === "low") parts.push("fits your budget range");
    if (prefs.budget === "premium" && area.zone === "high") parts.push("matches your premium preference");
    if (area.properties > 0) parts.push(`${area.properties} active listing${area.properties !== 1 ? 's' : ''}`);

    if (parts.length === 0) return `Area in ${area.city} with ${area.properties} listings.`;
    return parts.slice(0, 2).join(" and ") + ".";
  }

  function generatePropertyReason(p, prefs) {
    const parts = [];
    if (prefs.purpose.toLowerCase() === (p.purpose || "").toLowerCase()) parts.push("matches your purpose");
    if (prefs.budget === p.budget) parts.push("fits your budget tier");
    if ((p.beds || 0) >= 3 && prefs.lifestyle === "family") parts.push("good for families");
    if ((p.beds || 0) <= 2 && prefs.lifestyle === "student") parts.push("ideal for students");
    if (p.price > 0) parts.push(`priced at ${p.priceDisplay}`);

    if (parts.length === 0) return `Property in ${p.areaName || 'this area'}.`;
    return parts.slice(0, 2).join(" and ") + ".";
  }

  function generateDataDrivenTips(prefs) {
    const tips = [];

    if (firebaseProperties.length === 0) {
      tips.push({
        type: "Getting Started",
        icon: "bi-info-circle-fill",
        text: "No properties in the database yet. Visit the Properties page to add your first listing."
      });
      return tips;
    }

    const saleCount = firebaseProperties.filter(p => p.category === "For Sale").length;
    const rentCount = firebaseProperties.filter(p => p.category === "For Rent").length;

    if (prefs.purpose === "buy" && saleCount > 0) {
      tips.push({
        type: "Market Insight",
        icon: "bi-graph-up-arrow",
        text: `${saleCount} propert${saleCount !== 1 ? 'ies' : 'y'} currently listed for sale in the database.`
      });
    }

    if (prefs.purpose === "rent" && rentCount > 0) {
      tips.push({
        type: "Rental Market",
        icon: "bi-key-fill",
        text: `${rentCount} propert${rentCount !== 1 ? 'ies' : 'y'} available for rent.`
      });
    }

    const topArea = AREA_DATABASE.length > 0 
      ? AREA_DATABASE.reduce((a, b) => a.priceYoY > b.priceYoY ? a : b)
      : null;

    if (topArea && topArea.priceYoY > 0) {
      tips.push({
        type: "Growth Leader",
        icon: "bi-trending-up",
        text: `${topArea.name} shows the highest growth at +${topArea.priceYoY}% based on listing history.`
      });
    }

    if (prefs.lifestyle === "family") {
      tips.push({
        type: "Family Friendly",
        icon: "bi-people-fill",
        text: "Look for properties with 3+ bedrooms and security features for family living."
      });
    }

    if (prefs.lifestyle === "investment") {
      tips.push({
        type: "Investment Strategy",
        icon: "bi-cash-stack",
        text: "Areas with positive YoY growth and mid-range pricing often offer the best ROI."
      });
    }

    return tips;
  }

  // ========================================================================
  // 8. LOADING OVERLAY
  // ========================================================================

  const LOADING_MSGS = [
    "Loading your property database…",
    "Analyzing listing data…",
    "Calculating area metrics…",
    "Generating recommendations…",
    "Finalising your report…"
  ];

  async function showLoading(fn) {
    const overlay = $("aiLoadingOverlay");
    const msg = $("aiLoadingMsg");
    if (!overlay) return fn();

    overlay.classList.remove("d-none");

    let stop = false;
    const cycle = (async () => {
      let i = 0;
      while (!stop) {
        if (msg) msg.textContent = LOADING_MSGS[i % LOADING_MSGS.length];
        i++;
        await delay(900);
      }
    })();

    const minDisplay = delay(900);
    await Promise.all([runAnalysis(prefs), minDisplay]);
    stop = true;
    await cycle;

    overlay.classList.add("d-none");
    fn();
  }
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // ========================================================================
  // 9. SECTION: TOP AI PICKS
  // ========================================================================

  function renderTopPicks(filter = "all") {
    let pool;
    if (filter === "all") {
      pool = AI_PROPERTIES;
    } else {
      pool = AI_PROPERTIES.filter(p => (p.purpose || "").toLowerCase() === filter);
    }

    const sorted = [...pool].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    const seen = new Set();
    const filtered = sorted.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    if (filtered.length === 0) {
      const noListingsAtAll = AI_PROPERTIES.length === 0;
      $("topPicksGrid").innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="empty-state-box">
            <i class="bi bi-search-heart"></i>
            <h5>${noListingsAtAll ? "No Properties Listed Yet" : "No Matching Properties"}</h5>
            <p class="text-muted small">${noListingsAtAll
              ? "Your Firebase database is empty. Add properties on the Properties page to see AI recommendations."
              : "Try adjusting your filters or add more properties to the database."}</p>
            ${noListingsAtAll ? '<a href="property.html" class="btn btn-warning text-dark fw-bold mt-2" style="border-radius:8px;"><i class="bi bi-plus-circle me-2"></i>Add Property</a>' : ''}
          </div>
        </div>`;
      return;
    }

    const tagMap = {
      "Hot Deal": "hot", "AI Top Pick": "blue", "Best Value": "green",
      "High Growth": "green", "Investment": "amber", "Trending": "hot",
      "Budget Friendly": "green", "Premium": "amber", "Popular": "blue",
      "Fastest Growing": "hot", "New Listing": "blue"
    };

    const tierColor = { budget: "#10b981", mid: "#f59e0b", premium: "#ef4444" };
    const tierLabel = { budget: "Budget", mid: "Mid-Range", premium: "Premium" };

    $("topPicksGrid").innerHTML = filtered.map(p => {
      const isTop = p.aiScore >= 94;
      const tags = (p.tags || []).slice(0, 2).map(t =>
        `<span class="ai-tag ${tagMap[t] || 'blue'}">${t}</span>`).join("");
      const area = AREA_DATABASE.find(a => a.id === p.area);
      const budgeLabel = tierLabel[p.budget] || "";
      const budgeColor = tierColor[p.budget] || "#f59e0b";

      return `
        <div class="col-lg-4 col-md-6">
          <div class="ai-prop-card" onclick="openPropModal('${p.id}')">
            <div class="ai-card-img-wrap">
              <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'">
              <div class="ai-card-tags">${tags}</div>
              <div class="ai-score-badge ${isTop ? 'top' : ''}">
                <i class="bi bi-stars"></i> ${p.aiScore || 0}% AI
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
                ${area?.name || p.areaName || ''} · ${p.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
              </div>
              <div class="ai-card-specs">
                <span><i class="bi bi-bed-fill"></i>${p.beds} Beds</span>
                <span><i class="bi bi-water"></i>${p.baths} Baths</span>
                <span><i class="bi bi-rulers"></i>${p.size}</span>
              </div>
              <div class="ai-reason-chip"><i class="bi bi-robot me-1"></i>${p.aiReason || "Analysis pending — run AI Analysis for personalized scoring."}</div>
              <div class="score-bar-wrap">
                <div class="score-bar-label"><span>AI Match Score</span><span>${p.aiScore || 0}%</span></div>
                <div class="score-bar-track">
                  <div class="score-bar-fill" style="width:${p.aiScore || 0}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }).join("");
    animateBars();
  }

  // Filter pills
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTopPicks(btn.dataset.filter);
    });
  });

  // ========================================================================
  // 10. SECTION: MARKET INSIGHTS
  // ========================================================================

  function renderStats() {
    const qt = $("quarterlyText");
    if (qt) qt.textContent = currentCommentary || MARKET_INSIGHTS.quarterlyReport || "";

    const stats = MARKET_INSIGHTS.stats;
    if (!stats) return;

    if ($("statPriceIndex")) {
      const el = $("statPriceIndex");
      el.querySelector(".stat-val").textContent = stats.priceIndex || "—";
      el.querySelector(".stat-chg").textContent = stats.priceIndexChg || "—";
    }
    if ($("statYield")) {
      const el = $("statYield");
      el.querySelector(".stat-val").textContent = stats.avgYield || "—";
      el.querySelector(".stat-chg").textContent = stats.avgYieldChg || "—";
    }
    if ($("statDays")) {
      const el = $("statDays");
      el.querySelector(".stat-val").textContent = stats.avgDays || "—";
      el.querySelector(".stat-chg").textContent = stats.avgDaysChg || "—";
    }
    if ($("statDemand")) {
      const el = $("statDemand");
      el.querySelector(".stat-val").textContent = stats.demandIndex || "—";
      el.querySelector(".stat-chg").textContent = stats.demandSentiment || "—";
    }
    if ($("marketSentimentBadge")) {
      $("marketSentimentBadge").textContent = stats.marketSentiment || "—";
    }
    if ($("bestAreaGrowth")) {
      $("bestAreaGrowth").textContent = stats.bestAreaGrowth || "—";
    }
    if ($("fiveYearIRR")) {
      $("fiveYearIRR").textContent = stats.fiveYearIRR || "—";
    }
  }

  function renderMarketInsights() {
    if (AREA_DATABASE.length === 0) {
      $("hotCitiesList").innerHTML = '<div class="text-muted small text-center py-3">No area data available</div>';
      $("heatmapZones").innerHTML = '<div class="text-muted small text-center py-3">No zone data available</div>';
      return;
    }

    const ranked = [...AREA_DATABASE].sort((a, b) => b.priceYoY - a.priceYoY).slice(0, 5);
    $("hotCitiesList").innerHTML = ranked.map((a, i) => `
      <div class="hot-city-row">
        <span class="hot-rank">${i + 1}</span>
        <span class="flex-grow-1 fw-semibold">${a.name}</span>
        <span class="text-muted small me-2">${a.city}</span>
        <span class="hot-growth">+${a.priceYoY}%</span>
      </div>`).join("");

    const zones = getPriceZones();
    const byZone = { high: zones.filter(z => z.zone === "high"), mid: zones.filter(z => z.zone === "mid"), low: zones.filter(z => z.zone === "low") };
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
    $("heatmapZones").innerHTML = html || '<div class="text-muted small text-center">No zone data available</div>';
  }

  function getPriceZones() {
    return AREA_DATABASE.map(a => ({
      name: a.name,
      city: a.city,
      zone: a.zone,
      buyAvg: a.buyAvg,
      color: a.zone === "high" ? "#ef4444" : a.zone === "mid" ? "#f59e0b" : "#10b981"
    }));
  }

  // ========================================================================
  // 11. SECTION: TRENDING AREAS
  // ========================================================================

  function renderTrending() {
    const trending = AREA_DATABASE.filter(a => a.trending).sort((a, b) => b.priceYoY - a.priceYoY);
    if (trending.length === 0) {
      $("trendingGrid").innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="empty-state-box">
            <i class="bi bi-graph-down"></i>
            <h5>No Trending Areas Yet</h5>
            <p class="text-muted small">Trending areas will appear once you have multiple listings in the same area with price history.</p>
          </div>
        </div>`;
      return;
    }
    $("trendingGrid").innerHTML = trending.map(a => {
      const m = a.metrics;
      return `
        <div class="col-lg-3 col-md-6">
          <div class="trending-card">
            <div class="trending-img-wrap">
              <img src="${a.image}" alt="${a.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'">
              <span class="trending-badge">+${a.priceYoY}% YoY</span>
            </div>
            <div class="trending-body">
              <h4>${a.name}</h4>
              <div class="trending-city"><i class="bi bi-geo-alt text-primary"></i>${a.city}</div>
              <p class="text-muted small mt-2 mb-2" style="font-size:0.78rem;line-height:1.5;">${(a.description || '').slice(0, 90)}…</p>
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

  // ========================================================================
  // 12. SECTION: COMPARISON
  // ========================================================================

  function populateCompareDropdowns() {
    if (!AREA_DATABASE || AREA_DATABASE.length < 2) {
      $("compareA").innerHTML = '<option value="">No areas available</option>';
      $("compareB").innerHTML = '<option value="">No areas available</option>';
      return;
    }
    const options = AREA_DATABASE.map(a => `<option value="${a.id}">${a.name} — ${a.city}</option>`).join("");
    $("compareA").innerHTML = options;
    $("compareB").innerHTML = options;
    $("compareA").value = AREA_DATABASE[0].id;
    $("compareB").value = AREA_DATABASE[1].id;
  }

  $("runCompareBtn").addEventListener("click", async () => {
    const idA = $("compareA").value, idB = $("compareB").value;
    if (!idA || !idB) { alert("No areas available to compare."); return; }
    if (idA === idB) { alert("Please select two different areas to compare."); return; }
    const btn = $("runCompareBtn");
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Analysing…`;
    try {
      let result;
      if (AIEngine && AIEngine.compareWithAI) {
        result = await AIEngine.compareWithAI(idA, idB, prefs);
      } else {
        result = compareAreasDataDriven(idA, idB);
      }
      renderCompare(result);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });

  function compareAreasDataDriven(idA, idB) {
    const a = AREA_DATABASE.find(x => x.id === idA);
    const b = AREA_DATABASE.find(x => x.id === idB);
    if (!a || !b) return null;

    const factors = {};
    const metrics = [
      { key: "safety", label: "Safety" },
      { key: "affordability", label: "Affordability" },
      { key: "connectivity", label: "Connectivity" },
      { key: "growth", label: "Growth Potential" }
    ];

    metrics.forEach(m => {
      const scoreA = a.metrics[m.key] || 0;
      const scoreB = b.metrics[m.key] || 0;
      factors[m.key] = {
        label: m.label,
        scoreA: scoreA,
        scoreB: scoreB,
        winner: scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'tie'
      };
    });

    const totalA = Object.values(factors).reduce((sum, f) => sum + f.scoreA, 0);
    const totalB = Object.values(factors).reduce((sum, f) => sum + f.scoreB, 0);
    const winner = totalA > totalB ? a : b;

    return {
      a: a, b: b,
      totalScoreA: totalA,
      totalScoreB: totalB,
      overallWinner: winner,
      factors: factors,
      explanation: `${winner.name} scores higher on overall metrics (${Math.max(totalA, totalB)} vs ${Math.min(totalA, totalB)}) based on ${firebaseProperties.length} real listings.`
    };
  }

  function renderCompare(r) {
    if (!r) {
      $("compareResult").innerHTML = '<div class="alert alert-warning">Unable to compare areas. Insufficient data.</div>';
      $("compareResult").classList.remove("d-none");
      return;
    }

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

  // ========================================================================
  // 13. SECTION: INVESTMENT OPPORTUNITIES
  // ========================================================================

  function renderInvestment() {
    if (!AREA_DATABASE || AREA_DATABASE.length === 0) {
      $("investmentGrid").innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="empty-state-box">
            <i class="bi bi-graph-down"></i>
            <h5>No Investment Data Available</h5>
            <p class="text-muted small">Add properties to see AI-ranked investment opportunities calculated from your real listings.</p>
            <a href="property.html" class="btn btn-warning text-dark fw-bold mt-2" style="border-radius:8px;"><i class="bi bi-plus-circle me-2"></i>Add Property</a>
          </div>
        </div>`;
      return;
    }
    const ranked = [...AREA_DATABASE]
      .map(a => ({ ...a, investScore: a.metrics.growth * 0.4 + (a.priceYoY * 2) + a.metrics.safety * 0.15 + a.metrics.connectivity * 0.1 }))
      .sort((a, b) => b.investScore - a.investScore)
      .slice(0, 6);

    $("investmentGrid").innerHTML = ranked.map((a, i) => {
      const fiveYearROI = (a.priceYoY * 3.8).toFixed(1);
      return `
        <div class="col-lg-4 col-md-6">
          <div class="invest-card">
            <div class="d-flex align-items-start gap-2 mb-2">
              <div class="invest-rank">#${i + 1}</div>
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

  // ========================================================================
  // 14. SECTION: PERSONALIZED MATCHES
  // ========================================================================

  function renderMatches() {
    if (!AREA_DATABASE || AREA_DATABASE.length === 0) {
      $("matchGrid").innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="empty-state-box">
            <i class="bi bi-person-x"></i>
            <h5>No Area Matches Available</h5>
            <p class="text-muted small">Run AI Analysis after adding properties to generate personalized area matches.</p>
            <a href="property.html" class="btn btn-warning text-dark fw-bold mt-2" style="border-radius:8px;"><i class="bi bi-plus-circle me-2"></i>Add Property</a>
          </div>
        </div>`;
      return;
    }
    const matches = [...AREA_DATABASE]
      .map(a => ({
        ...a,
        matchScore: a._aiMatchScore || 0,
        reason: a._aiMatchReason || "Run AI Analysis for personalized scoring."
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

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

  // ========================================================================
  // 15. SECTION: AI TIPS
  // ========================================================================

  function renderTips() {
    const tips = currentTips.length ? currentTips : generateDataDrivenTips(prefs);
    if (tips.length === 0) {
      $("aiTipsGrid").innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="text-muted small">Add properties and run AI Analysis to get personalized tips.</p>
        </div>`;
      return;
    }
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

  // ========================================================================
  // 16. AI RUN ANALYSIS BUTTON
  // ========================================================================

  $("runAiBtn").addEventListener("click", () => {
    prefs.purpose = $("prefPurpose").value;
    prefs.lifestyle = $("prefLifestyle").value;
    prefs.budget = $("prefBudget").value;
    showLoading(() => {
      renderStats();
      renderTopPicks("all");
      renderMatches();
      renderTips();
      document.querySelector("#topPicks").scrollIntoView({ behavior: "smooth" });
    });
  });

  // ========================================================================
  // 17. PROPERTY MODAL
  // ========================================================================

  window.openPropModal = function(id) {
    const p = AI_PROPERTIES.find(x => x.id === id);
    if (!p) return;
    const area = AREA_DATABASE.find(a => a.id === p.area);
    $("propDetailModalLabel").textContent = p.title;
    $("propDetailBody").innerHTML = `
      <div class="row g-4">
        <div class="col-md-6">
          <img src="${p.image}" alt="${p.title}" class="img-fluid rounded-4 w-100" style="height:280px;object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'">
        </div>
        <div class="col-md-6">
          <div class="fs-3 fw-bold text-primary mb-2">${p.priceDisplay}</div>
          <div class="text-muted small mb-3"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${area?.name || p.areaName || ''}${area ? ', ' + (area.city || '') : ''}</div>
          <div class="d-flex gap-3 mb-3 flex-wrap">
            <span><i class="bi bi-bed-fill text-primary me-1"></i>${p.beds} Beds</span>
            <span><i class="bi bi-water text-primary me-1"></i>${p.baths} Baths</span>
            <span><i class="bi bi-rulers text-primary me-1"></i>${p.size}</span>
            <span><i class="bi bi-house-door text-primary me-1"></i>${p.type}</span>
          </div>
          <div class="ai-reason-chip mb-3"><i class="bi bi-robot me-1"></i>${p.aiReason || "Analysis pending — run AI Analysis for personalized scoring."}</div>
          <div class="d-flex flex-wrap gap-2 mb-3">
            ${(p.features || []).map(f => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">${f}</span>`).join("")}
          </div>
          <div class="score-bar-wrap">
            <div class="score-bar-label"><span>AI Match Score</span><span>${p.aiScore || 0}%</span></div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${p.aiScore || 0}%"></div></div>
          </div>
        </div>
      </div>
      <div class="mt-3 border-top pt-3">
        <p class="text-muted small mb-2"><strong>Area Overview:</strong> ${area?.description || 'No area data available.'}</p>
        <div class="row g-2 text-center">
          ${['safety', 'affordability', 'connectivity', 'growth'].map(m => `
            <div class="col-3">
              <div class="p-2 border rounded-3">
                <div class="fw-bold text-primary">${(area && area.metrics && area.metrics[m]) || 'N/A'}</div>
                <div class="text-muted" style="font-size:0.7rem">${m.charAt(0).toUpperCase() + m.slice(1)}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>
      <div class="mt-3 d-flex gap-2">
        <a href="listing.html?area=${p.area || ''}" class="btn btn-primary flex-grow-1 fw-semibold">
          <i class="bi bi-check-circle-fill me-1"></i>Select Property
        </a>
        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
      </div>`;
    new bootstrap.Modal($("propDetailModal")).show();
  };

  // ========================================================================
  // 18. ANIMATE BARS
  // ========================================================================

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

  // ========================================================================
  // 19. INITIALIZATION
  // ========================================================================

  async function init() {
    initBackToTop();

    // Load data from Firebase
    await initializeData();

    // Initial renders with whatever data we have
    renderStats();
    renderTopPicks();
    renderMarketInsights();
    renderTrending();
    populateCompareDropdowns();
    renderInvestment();

    // If we have data, run AI analysis
    if (firebaseProperties.length > 0) {
      showLoading(() => {
        renderStats();
        renderTopPicks("all");
        renderMatches();
        renderTips();
      });
    } else {
      // Show empty states without loading overlay
      renderMatches();
      renderTips();
    }

    // Real-time listener: re-fetch when any property changes in Firebase
    propertiesDbRef.on('child_changed', function() {
      refreshAllData();
    });
    propertiesDbRef.on('child_removed', function() {
      refreshAllData();
    });
    // Also refresh when tab regains focus (user comes back from seller dashboard)
    window.addEventListener('focus', function() {
      refreshAllData();
    });

    async function refreshAllData() {
      firebaseProperties = (await API.fetchAll(true)).filter(function(p) { return p.status !== 'Disabled'; });
      AREA_DATABASE = buildAreaDatabase(firebaseProperties);
      AI_PROPERTIES = buildAIProperties(firebaseProperties);
      MARKET_INSIGHTS = buildMarketInsights(firebaseProperties, AREA_DATABASE);
      AI_PROPERTIES.forEach(p => {
        const area = AREA_DATABASE.find(a => 
          p.areaName.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(p.areaName.toLowerCase())
        );
        if (area) {
          p.area = area.id;
        }
      });
      renderStats();
      renderTopPicks("all");
      renderMarketInsights();
      renderTrending();
      populateCompareDropdowns();
      renderInvestment();
      renderMatches();
      renderTips();
    }
  }

  init();
});