const HomepageEnhanced = (function() {
  let _allProperties = [];

  async function init() {
    try {
      _allProperties = await NestFinderAPI.fetchAll();
    } catch (e) {
      console.error("HomepageEnhanced: Failed to fetch properties", e);
      _allProperties = [];
    }
    renderFeaturedProperties();
    renderBrowseByCity();
    renderMarketStats();
    renderWhyChoose();
    renderTestimonials();
    renderHowItWorks();
    renderBecomeSeller();
    renderFeaturedAreas();
    initFaq();
  }

  function getProperties() { return _allProperties; }

  function formatPrice(n) {
    n = Number(n);
    if (isNaN(n) || n === 0) return "PKR 0";
    if (n >= 10000000) return "PKR " + (n / 10000000).toFixed(1) + " Cr";
    if (n >= 100000) return "PKR " + (n / 100000).toFixed(1) + " Lac";
    return "PKR " + n.toLocaleString();
  }

  /* === Featured Properties === */
  function renderFeaturedProperties() {
    const container = document.getElementById("featuredProperties");
    if (!container) return;
    const props = getProperties().slice(0, 6);
    if (props.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-muted">No properties available yet. <a href="acc.html" style="color:#f59e0b">Add your first listing</a></div>';
      return;
    }
    container.innerHTML = props.map(p => {
      const img = (p.images && p.images[0]) || (p.carouselImages && p.carouselImages[0]) || "https://placehold.co/600x400?text=Property";
      const id = p.firebaseKey || p.id;
      return `<div class="col-md-4 col-6 mb-3">
        <div class="hp-featured-card" onclick="window.location.href='listing.html?id=${id}'">
          <div class="hp-featured-img" style="background-image:url('${img}')">
            <span class="hp-featured-badge">${p.purpose || "Buy"}</span>
          </div>
          <div class="hp-featured-info">
            <div class="hp-featured-price">${formatPrice(p.price)}</div>
            <div class="hp-featured-title">${p.title || "Property"}</div>
            <div class="hp-featured-loc"><i class="bi bi-geo-alt"></i> ${p.location || "N/A"}</div>
            <div class="hp-featured-specs"><span>${p.bedrooms || "?"} Beds</span><span>${p.bathrooms || "?"} Baths</span><span>${p.areaSize || "N/A"}</span></div>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  /* === Browse by City === */
  function renderBrowseByCity() {
    const container = document.getElementById("browseByCity");
    if (!container) return;
    const cityCounts = {};
    getProperties().forEach(p => {
      if (!p.location) return;
      const parts = p.location.split(",").map(s => s.trim());
      const city = parts[parts.length - 1] || "Unknown";
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    const cities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (cities.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-3">No cities yet.</div>';
      return;
    }
    const cityImages = {
      "Karachi": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400",
      "Lahore": "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400",
      "Islamabad": "https://images.unsplash.com/photo-1599571234900-2c3eaa5a19b0?w=400",
      "Rawalpindi": "https://images.unsplash.com/photo-1599571234900-2c3eaa5a19b0?w=400",
      "Faisalabad": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
      "Peshawar": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400"
    };
    container.innerHTML = cities.map(([city, count]) =>
      `<div class="col-md-4 col-6 mb-3">
        <div class="hp-city-card" onclick="window.location.href='property.html?city=${encodeURIComponent(city)}'">
          <div class="hp-city-bg" style="background-image:url('${cityImages[city] || "https://placehold.co/400x250?text=" + city}')"></div>
          <div class="hp-city-overlay"></div>
          <div class="hp-city-info">
            <div class="hp-city-name">${city}</div>
            <div class="hp-city-count">${count} listing${count !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>`
    ).join("");
  }

  /* === Market Statistics === */
  function renderMarketStats() {
    const container = document.getElementById("marketStats");
    if (!container) return;
    const props = getProperties();
    const total = props.length;
    const prices = props.map(p => Number(p.price)).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const cities = new Set(props.map(p => p.location ? p.location.split(",").pop().trim() : "").filter(Boolean));
    const types = new Set(props.map(p => p.type || p.propertyType || "").filter(Boolean));

    // Use AI for market insights if enough data
    (async () => {
      if (total < 3) {
        container.innerHTML = `<div class="row g-3">
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${total}</div><div class="hp-stat-lbl">Total Listings</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${avgPrice ? formatPrice(avgPrice) : "N/A"}</div><div class="hp-stat-lbl">Avg Price</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${cities.size}</div><div class="hp-stat-lbl">Cities</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${types.size}</div><div class="hp-stat-lbl">Property Types</div></div></div>
        </div>`;
        return;
      }
      try {
        const insight = await AIEngine.marketOverview(props);
        container.innerHTML = `<div class="row g-3">
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${insight.totalActiveListings || total}</div><div class="hp-stat-lbl">Total Listings</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${insight.averagePrice ? formatPrice(insight.averagePrice) : formatPrice(avgPrice)}</div><div class="hp-stat-lbl">Avg Price</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${insight.topPerformingAreas?.slice(0, 2).join(", ") || cities.size}</div><div class="hp-stat-lbl">Top Areas</div></div></div>
          <div class="col-md-3 col-6">
            <div class="hp-stat-card">
              <div class="hp-stat-val" style="font-size:1rem">${insight.marketHealth || "Moderate"}</div>
              <div class="hp-stat-lbl">Market Health</div>
              <small style="color:${insight.priceTrend === "increasing" ? "#22c55e" : insight.priceTrend === "decreasing" ? "#ef4444" : "#f59e0b"};font-size:0.7rem">
                ${insight.priceTrend === "increasing" ? "↑ Rising" : insight.priceTrend === "decreasing" ? "↓ Falling" : "→ Stable"}
              </small>
            </div>
          </div>
        </div>
        ${insight.insight ? '<div class="hp-insight-banner mt-3"><i class="bi bi-info-circle-fill me-2" style="color:#f59e0b"></i>' + insight.insight + '</div>' : ''}`;
      } catch (e) {
        container.innerHTML = `<div class="row g-3">
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${total}</div><div class="hp-stat-lbl">Total Listings</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${avgPrice ? formatPrice(avgPrice) : "N/A"}</div><div class="hp-stat-lbl">Avg Price</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${cities.size}</div><div class="hp-stat-lbl">Cities</div></div></div>
          <div class="col-md-3 col-6"><div class="hp-stat-card"><div class="hp-stat-val">${types.size}</div><div class="hp-stat-lbl">Property Types</div></div></div>
        </div>`;
      }
    })();
  }

  /* === Featured Areas === */
  function renderFeaturedAreas() {
    const container = document.getElementById("featuredAreas");
    if (!container) return;
    const cities = {};
    getProperties().forEach(p => {
      if (!p.location) return;
      const parts = p.location.split(",").map(s => s.trim());
      const city = parts[parts.length - 1] || "Unknown";
      if (city && city.toLowerCase() !== "unknown") {
        cities[city] = (cities[city] || 0) + 1;
      }
    });
    const sorted = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (sorted.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-3">No featured areas yet.</div>';
      return;
    }
    container.innerHTML = sorted.map(([city, count]) =>
      `<div class="col-md-4 col-6 mb-3">
        <div class="hp-area-card" onclick="window.location.href='area-insight.html?city=${encodeURIComponent(city)}'">
          <div class="hp-area-icon"><i class="bi bi-geo-alt-fill"></i></div>
          <div class="hp-area-name">${city}</div>
          <div class="hp-area-count">${count} listing${count !== 1 ? "s" : ""}</div>
        </div>
      </div>`
    ).join("");
  }

  /* === Why Choose NestFinder AI === */
  function renderWhyChoose() {
    const container = document.getElementById("whyChoose");
    if (!container) return;
    const features = [
      { icon: "bi-robot", title: "AI-Powered Insights", desc: "Intelligent property recommendations and market analysis powered by advanced AI." },
      { icon: "bi-shield-check", title: "Verified Listings", desc: "All properties are verified for authenticity and accuracy." },
      { icon: "bi-graph-up", title: "Real-Time Analytics", desc: "Live market data and area intelligence from Firebase." },
      { icon: "bi-people", title: "Expert Support", desc: "Dedicated real estate professionals to guide you." }
    ];
    container.innerHTML = features.map(f =>
      `<div class="col-md-3 col-6 mb-3">
        <div class="hp-why-card">
          <div class="hp-why-icon"><i class="bi ${f.icon}"></i></div>
          <div class="hp-why-title">${f.title}</div>
          <div class="hp-why-desc">${f.desc}</div>
        </div>
      </div>`
    ).join("");
  }

  /* === Testimonials === */
  function renderTestimonials() {
    const container = document.getElementById("testimonials");
    if (!container) return;
    const testimonials = [
      { name: "Ahmed Khan", role: "Home Buyer", text: "NestFinder AI helped me find the perfect home in DHA. The AI recommendations were spot-on!", icon: "bi-person-circle" },
      { name: "Fatima Ali", role: "Real Estate Investor", text: "The area insights and investment scores are incredibly accurate. Made my investment decisions much easier.", icon: "bi-person-circle" },
      { name: "Usman Raza", role: "Property Seller", text: "Listing my property was seamless. The analytics dashboard helped me price it perfectly.", icon: "bi-person-circle" }
    ];
    container.innerHTML = testimonials.map(t =>
      `<div class="col-md-4 mb-3">
        <div class="hp-testimonial-card">
          <div class="hp-testimonial-stars">${"★".repeat(5)}</div>
          <p class="hp-testimonial-text">"${t.text}"</p>
          <div class="hp-testimonial-author">
            <i class="bi ${t.icon}" style="font-size:1.5rem;color:#f59e0b"></i>
            <div><strong>${t.name}</strong><br><small style="color:rgba(128,128,128,0.6)">${t.role}</small></div>
          </div>
        </div>
      </div>`
    ).join("");
  }

  /* === How It Works === */
  function renderHowItWorks() {
    const container = document.getElementById("howItWorks");
    if (!container) return;
    const steps = [
      { icon: "bi-search", num: "01", title: "Browse Listings", desc: "Explore properties with AI-powered filters and recommendations." },
      { icon: "bi-stars", num: "02", title: "Get AI Insights", desc: "View investment scores, price predictions, and area intelligence." },
      { icon: "bi-calendar-check", num: "03", title: "Schedule Visit", desc: "Book a tour of your shortlisted properties with one click." },
      { icon: "bi-house-heart", num: "04", title: "Move In", desc: "Complete the process with expert guidance every step." }
    ];
    container.innerHTML = steps.map((s, i) =>
      `<div class="col-md-3 mb-3">
        <div class="hp-step-card">
          <div class="hp-step-num">${s.num}</div>
          <div class="hp-step-icon"><i class="bi ${s.icon}"></i></div>
          <div class="hp-step-title">${s.title}</div>
          <div class="hp-step-desc">${s.desc}</div>
          ${i < steps.length - 1 ? '<div class="hp-step-line"></div>' : ''}
        </div>
      </div>`
    ).join("");
  }

  /* === Become a Seller === */
  function renderBecomeSeller() {
    const container = document.getElementById("becomeSeller");
    if (!container) return;
    container.innerHTML = `
      <div class="hp-cta-section">
        <div class="row align-items-center">
          <div class="col-lg-8">
            <h2 class="hp-cta-title">Want to Sell Your Property?</h2>
            <p class="hp-cta-text">List your property on NestFinder AI and reach thousands of potential buyers. Get AI-powered pricing suggestions and market insights.</p>
          </div>
          <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
            <a href="acc.html" class="hp-cta-btn"><i class="bi bi-plus-circle me-2"></i>List Your Property</a>
          </div>
        </div>
      </div>`;
  }

  /* === FAQ Toggle === */
  function initFaq() {
    document.querySelectorAll(".hp-faq-question").forEach(btn => {
      btn.addEventListener("click", function() {
        const expanded = this.getAttribute("aria-expanded") === "true";
        this.setAttribute("aria-expanded", !expanded);
        const answer = this.nextElementSibling;
        if (answer) {
          answer.style.display = expanded ? "none" : "block";
        }
      });
    });
  }

  return { init, getProperties };
})();

document.addEventListener("DOMContentLoaded", () => {
  // Only init if the page has homepage sections
  if (document.getElementById("featuredProperties") ||
      document.getElementById("browseByCity") ||
      document.getElementById("marketStats")) {
    HomepageEnhanced.init();
  }
});
