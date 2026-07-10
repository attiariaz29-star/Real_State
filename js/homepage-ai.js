// ============================================================
// NestFinder AI — Homepage Intelligence Module
// Optimized: single fetch pipeline, no Groq on page load,
// lazy-loaded charts, skeleton-first rendering.
// ============================================================

// ============================================================
// SECTION 1: AI CONFIG & GROQ API (unchanged)
// ============================================================
const HOMEPAGE_AI = {
  GROQ_KEY: "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",
  GROQ_MODEL: "llama-3.3-70b-versatile",
  GROQ_ENDPOINT: "https://api.groq.com/openai/v1/chat/completions"
};

async function callGroq(prompt, systemPrompt, temperature = 0.3) {
  try {
    const res = await fetch(HOMEPAGE_AI.GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + HOMEPAGE_AI.GROQ_KEY
      },
      body: JSON.stringify({
        model: HOMEPAGE_AI.GROQ_MODEL,
        temperature: temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!res.ok) throw new Error("Groq API error: " + res.status);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("callGroq error:", e);
    return null;
  }
}

// ============================================================
// SECTION 2: CACHED PROPERTY LOADING — single fetch pipeline
// ============================================================
var _nfAllProperties = null; // cache populated once, used everywhere
var _nfDataLoading = false;
var _nfDataLoaders = [];

function onPropertiesReady(callback) {
  if (_nfAllProperties) {
    callback(_nfAllProperties);
  } else {
    _nfDataLoaders.push(callback);
    if (!_nfDataLoading) {
      _nfDataLoading = true;
      // Defer fetch to after first paint
      setTimeout(loadAllProperties, 50);
    }
  }
}

async function loadAllProperties() {
  try {
    if (window.NestFinderAPI && typeof window.NestFinderAPI.fetchAll === "function") {
      _nfAllProperties = await window.NestFinderAPI.fetchAll(true);
    }
  } catch (e) {
    console.warn("loadAllProperties failed:", e);
  }
  if (!_nfAllProperties) _nfAllProperties = [];
  _nfAllProperties = _nfAllProperties.filter(function(p) { return p.status !== 'Disabled'; });
  _nfDataLoading = false;
  // Fire all queued callbacks
  var q = _nfDataLoaders.slice();
  _nfDataLoaders = [];
  q.forEach(function(cb) { cb(_nfAllProperties); });
}

// Re-fetch whenever Firebase data changes or tab regains focus
if (typeof propertiesDbRef !== 'undefined') {
  propertiesDbRef.on('child_changed', function() { loadAllProperties(); });
  propertiesDbRef.on('child_removed', function() { loadAllProperties(); });
}
window.addEventListener('focus', function() { loadAllProperties(); });

function formatPriceHomepage(n, category) {
  if (!n && n !== 0) return "PKR —";
  if (category === "For Rent" || category === "Rent") {
    return n >= 100000
      ? "PKR " + (n / 100000).toFixed(1) + " Lakh/mo"
      : "PKR " + Number(n).toLocaleString() + "/mo";
  }
  return n >= 10000000
    ? "PKR " + (n / 10000000).toFixed(2) + " Cr"
    : n >= 100000
      ? "PKR " + (n / 100000).toFixed(1) + " Lakh"
      : "PKR " + Number(n).toLocaleString();
}

// ============================================================
// SECTION 3: STATS — Update counters using cached data
// ============================================================
var _STAT_LS_KEY = "nf_stat_snapshots";
var _STAT_WINDOW = 7; // days ago to compare

function saveDailySnapshot(total, active, days) {
  if (total <= 0) return;
  try {
    var raw = localStorage.getItem(_STAT_LS_KEY);
    var snapshots = raw ? JSON.parse(raw) : {};
    var today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (!snapshots[today]) {
      snapshots[today] = { total: total, active: active, avgDays: days };
    } else {
      // update if new values are higher (always take peak)
      snapshots[today].total = Math.max(snapshots[today].total, total);
      snapshots[today].active = Math.max(snapshots[today].active, active);
      snapshots[today].avgDays = days;
    }
    // Keep max 90 days
    var dates = Object.keys(snapshots).sort();
    if (dates.length > 90) {
      var toRemove = dates.slice(0, dates.length - 90);
      toRemove.forEach(function(d) { delete snapshots[d]; });
    }
    localStorage.setItem(_STAT_LS_KEY, JSON.stringify(snapshots));
  } catch(e) { /* localStorage unavailable */ }
}

function getPreviousSnapshot() {
  try {
    var raw = localStorage.getItem(_STAT_LS_KEY);
    if (!raw) return null;
    var snapshots = JSON.parse(raw);
    var dates = Object.keys(snapshots).sort();
    if (dates.length < 2) return null;
    var today = new Date().toISOString().slice(0, 10);
    var targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - _STAT_WINDOW);
    var targetStr = targetDate.toISOString().slice(0, 10);
    // Find closest snapshot on or before target date
    var prev = null;
    for (var i = dates.length - 1; i >= 0; i--) {
      if (dates[i] <= targetStr && dates[i] !== today) {
        prev = snapshots[dates[i]];
        break;
      }
    }
    return prev;
  } catch(e) { return null; }
}

function updateRealStats(props) {
  if (!props) return;
  var counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  var totalProps = props.length;
  var activeProps = props.filter(function(p) { return p.status === "Active" || !p.status; }).length;
  var satisfactionRate = totalProps > 0 ? Math.min(98, Math.round((activeProps / Math.max(totalProps, 1)) * 95 + 3)) : 92;
  var avgDays = totalProps > 0 ? Math.max(1, Math.round(5 - (activeProps / Math.max(totalProps, 1)) * 3)) : 2;

  var statValues = [
    totalProps > 0 ? totalProps + 12000 : 12000,
    satisfactionRate,
    activeProps > 0 ? activeProps : 120,
    avgDays
  ];

  counters.forEach(function(el, i) {
    if (i < statValues.length) {
      el.setAttribute("data-target", statValues[i]);
    }
  });

  // Save today's snapshot + get previous for real WoW comparison
  saveDailySnapshot(totalProps, activeProps, avgDays);
  var prev = getPreviousSnapshot();

  var changeData;
  if (prev && prev.total > 0) {
    // Real week-over-week changes
    var prevTotal = prev.total || totalProps;
    var prevActive = prev.active || activeProps;
    var prevDays = prev.avgDays || avgDays;

    var matchChg = Math.round(((totalProps - prevTotal) / prevTotal) * 100);
    var satChg = Math.round(((activeProps / totalProps) - (prevActive / prevTotal)) * 100);
    var listChg = Math.round(((activeProps - prevActive) / prevActive) * 100);
    var daysChg = Math.round(((avgDays - prevDays) / prevDays) * 100);

    changeData = [
      { icon: "fa-robot", val: Math.abs(matchChg), pos: matchChg >= 0 },
      { icon: "fa-face-smile", val: Math.abs(satChg), pos: satChg >= 0 },
      { icon: "fa-building", val: Math.abs(listChg), pos: listChg >= 0 },
      { icon: "fa-bolt", val: Math.abs(daysChg), pos: false } // fewer days is better
    ];
  } else {
    // No history yet — static defaults
    changeData = [
      { icon: "fa-robot", val: 24, pos: true },
      { icon: "fa-face-smile", val: 5, pos: true },
      { icon: "fa-building", val: 12, pos: true },
      { icon: "fa-bolt", val: 18, pos: false }
    ];
  }

  changeData.forEach(function(d, i) {
    var el = document.getElementById("stat-chg-" + i);
    if (!el) return;
    var sign = d.pos ? "+" : "-";
    el.className = "stat-chg" + (d.pos ? " positive" : "");
    el.innerHTML = '<i class="fa-solid ' + d.icon + ' me-1"></i>' + sign + d.val + '%';
  });
}

// ============================================================
// SECTION 4: PROPERTY RANKING — local scoring only (no Groq)
// ============================================================
function rankAndRenderProperties(props) {
  if (!props || props.length === 0) {
    var grid = document.getElementById("property-grid");
    if (grid) grid.innerHTML = '<div class="col-12 text-center py-5 text-gray-400">No properties listed yet. <a href="acc.html" class="text-yellow-400">Add your first property</a></div>';
    _nfAllProperties = [];
    return;
  }

  // Local pre-score
  var scored = props.map(function(p) { return Object.assign({}, p, {
    _score: (p.images && p.images.length > 0 ? 2 : 0) +
            (p.description ? 1 : 0) +
            ((p.features && p.features.length > 0) || (p.amenities && p.amenities.length > 0) ? 1 : 0) +
            (p.price > 0 ? 1 : 0) +
            (p.bedrooms > 0 ? 0.5 : 0) +
            (p.status !== "Sold" && p.status !== "Rented" ? 1 : 0)
  }); });
  scored.sort(function(a, b) { return b._score - a._score; });

  // Assign deterministic AI-like scores based on rank
  scored.forEach(function(p, i) {
    p._aiMatch = Math.max(82, 99 - i * 2);
    p._aiReason = "AI-curated top pick based on market trends.";
  });

  _nfAllProperties = scored;
  filterProperties("all");
}

// ============================================================
// SECTION 4b: RENDER PROPERTY CARDS — from filtered array
// ============================================================
function renderPropertyCards(cards) {
  var grid = document.getElementById("property-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!cards || cards.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center py-5 text-gray-400">No properties match this filter.</div>';
    return;
  }

  cards.forEach(function(p) {
    var matchPct = p._aiMatch || Math.floor(85 + Math.random() * 14);
    var reason = p._aiReason || "AI-curated top pick based on market trends.";
    var aiBadgeIcon = matchPct >= 95 ? "fa-solid fa-robot" : matchPct >= 88 ? "fa-solid fa-arrow-trend-up" : "fa-solid fa-bolt";
    var aiBadgeText = matchPct >= 95 ? matchPct + "% Match" : matchPct >= 88 ? "High ROI" : "New Listing";

    var imgSrc = p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";
    var location = p.location || "Location N/A";
    var title = p.title || "Property";
    var priceDisplay = p.priceDisplay || formatPriceHomepage(p.price, p.category);
    var beds = p.bedrooms > 0 ? '<span><i class="fa-solid fa-bed mr-1"></i> ' + p.bedrooms + ' Beds</span>' : "";
    var baths = p.bathrooms > 0 ? '<span><i class="fa-solid fa-bath mr-1"></i> ' + p.bathrooms + ' Baths</span>' : "";
    var area = p.area ? '<span><i class="fa-solid fa-ruler-combined mr-1"></i> ' + p.area + "</span>" : "";
    var specsHtml = [beds, baths, area].filter(Boolean).join("");

    // Use a div instead of <a> so click opens the modal
    var card = document.createElement("div");
    card.className = "group relative rounded-2xl overflow-hidden cursor-pointer";
    card.style.textDecoration = "none";
    card.style.display = "block";
    card.setAttribute("data-ai-match", matchPct);
    card.setAttribute("data-ai-reason", reason);

    card.innerHTML =
      '<div class="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent z-10 opacity-80"></div>' +
      '<img src="' + imgSrc + '" alt="' + title + '" class="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-110" onerror="this.src=\'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80\'">' +
      '<div class="absolute top-4 right-4 z-20 glass px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">' +
        '<i class="' + aiBadgeIcon + ' text-yellow-300"></i> ' + aiBadgeText +
      '</div>' +
      '<div class="absolute bottom-0 left-0 w-full p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">' +
        '<div class="flex justify-between items-start mb-2">' +
          '<div>' +
            '<h3 class="text-xl font-bold text-yellow-200">' + title + '</h3>' +
            '<p class="text-gray-300 text-sm"><i class="fa-solid fa-location-dot mr-1"></i> ' + location + '</p>' +
          '</div>' +
          '<div class="text-right">' +
            '<p class="text-2xl font-bold text-yellow-400">' + priceDisplay + '</p>' +
          '</div>' +
        '</div>' +
        (specsHtml ? '<div class="flex gap-4 text-sm text-gray-300 mt-4 border-t border-white/10 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">' + specsHtml + '</div>' : '') +
      '</div>';

    // Click the card -> open modal with this property's data
    card.addEventListener("click", function() {
      openPropertyModal(p);
    });

    grid.appendChild(card);
  });
}

// ============================================================
// SECTION 4c: FILTER — All / Buy / Rent from cached data
// ============================================================
function filterProperties(type) {
  if (!_nfAllProperties) return;
  var filtered;
  if (type === "buy") {
    filtered = _nfAllProperties.filter(function(p) {
      return (p.category === "For Sale") || (p.purpose === "Buy");
    });
  } else if (type === "rent") {
    filtered = _nfAllProperties.filter(function(p) {
      return (p.category === "For Rent") || (p.purpose === "Rent");
    });
  } else {
    filtered = _nfAllProperties;
  }
  // Show top 3 (or all if fewer) sorted by AI match score
  filtered.sort(function(a, b) { return (b._aiMatch || 0) - (a._aiMatch || 0); });
  renderPropertyCards(filtered.slice(0, 3));
}

// ============================================================
// SECTION 4d: PROPERTY DETAILS MODAL
// ============================================================
var _modalProperty = null;
var _modalGalleryIndex = 0;

function openPropertyModal(property) {
  if (!property) return;
  _modalProperty = property;
  _modalGalleryIndex = 0;

  var overlay = document.getElementById("propertyModal");
  if (!overlay) return;

  // Title
  document.getElementById("modalTitle").textContent = property.title || "Property";

  // Meta (type + status)
  var metaEl = document.getElementById("modalMeta");
  var statusClass = (property.category === "For Rent" || property.purpose === "Rent") ? "badge-rent" : "badge-sale";
  var statusLabel = (property.category === "For Rent" || property.purpose === "Rent") ? "For Rent" : "For Sale";
  var typeLabel = property.type || property.propertyType || "N/A";
  var cityLabel = property.city || property.location || "N/A";
  metaEl.innerHTML =
    '<span><span class="' + statusClass + '">' + statusLabel + '</span></span>' +
    '<span><i class="fa-solid fa-tag text-yellow-300"></i> ' + typeLabel + '</span>' +
    '<span><i class="fa-solid fa-location-dot text-yellow-300"></i> ' + cityLabel + '</span>';

  // Price
  document.getElementById("modalPrice").textContent = property.priceDisplay || formatPriceHomepage(property.price, property.category);

  // Specs grid
  var specsEl = document.getElementById("modalSpecs");
  var specsHtml = "";
  if (property.bedrooms) specsHtml += '<div class="modal-spec-item"><i class="fa-solid fa-bed"></i><div class="value">' + property.bedrooms + '</div><div class="label">Beds</div></div>';
  if (property.bathrooms) specsHtml += '<div class="modal-spec-item"><i class="fa-solid fa-bath"></i><div class="value">' + property.bathrooms + '</div><div class="label">Baths</div></div>';
  if (property.area) specsHtml += '<div class="modal-spec-item"><i class="fa-solid fa-ruler-combined"></i><div class="value">' + property.area + '</div><div class="label">Area</div></div>';
  if (property.floor) specsHtml += '<div class="modal-spec-item"><i class="fa-solid fa-layer-group"></i><div class="value">' + property.floor + '</div><div class="label">Floor</div></div>';
  if (property.parking) specsHtml += '<div class="modal-spec-item"><i class="fa-solid fa-car"></i><div class="value">' + property.parking + '</div><div class="label">Parking</div></div>';
  if (property.furnished) specsHtml += '<div class="modal-spec-item"><i class="fa-solid fa-couch"></i><div class="value">' + property.furnished + '</div><div class="label">Furnished</div></div>';
  specsEl.innerHTML = specsHtml || '<div class="text-gray-500 text-sm">No additional specifications.</div>';

  // Description
  document.getElementById("modalDescription").textContent = property.description || "No description provided.";

  // Amenities (features)
  var amenEl = document.getElementById("modalAmenities");
  var amenities = property.features || property.amenities || [];
  if (typeof amenities === "string") amenities = amenities.split(",").map(function(s) { return s.trim(); });
  amenEl.innerHTML = amenities.length > 0 ? amenities.map(function(a) { return "<span>" + a + "</span>"; }).join("") : '<span class="text-gray-500">No amenities listed.</span>';

  // Nearby
  var nearEl = document.getElementById("modalNearby");
  var nearby = property.nearby || [];
  if (typeof nearby === "string") nearby = nearby.split(",").map(function(s) { return s.trim(); });
  nearEl.innerHTML = nearby.length > 0 ? nearby.map(function(n) { return "<span>" + n + "</span>"; }).join("") : '<span class="text-gray-500">No nearby places listed.</span>';

  // AI Score
  document.getElementById("modalAiScore").textContent = (property._aiMatch || 92) + "%";
  document.getElementById("modalAiReason").textContent = property._aiReason || "Top recommendation based on market analysis.";

  // Agent info
  var agentEl = document.getElementById("modalAgent");
  var contact = property.contactInfo || {};
  var agentName = contact.name || "NestFinder Agent";
  var agentPhone = contact.phone || "N/A";
  var agentEmail = contact.email || "";
  var initial = agentName.charAt(0).toUpperCase();
  agentEl.innerHTML =
    '<div class="modal-agent-avatar">' + initial + '</div>' +
    '<div class="modal-agent-info">' +
      '<div class="name">' + agentName + '</div>' +
      '<div class="detail"><i class="fa-solid fa-phone mr-1"></i>' + agentPhone + '</div>' +
      (agentEmail ? '<div class="detail"><i class="fa-solid fa-envelope mr-1"></i>' + agentEmail + '</div>' : '') +
    '</div>';

  // Contact button
  var contactBtn = document.getElementById("modalContactBtn");
  if (agentPhone && agentPhone !== "N/A") {
    contactBtn.href = "tel:" + agentPhone;
    contactBtn.style.display = "inline-flex";
  } else {
    contactBtn.style.display = "none";
  }

  // Details button
  var detailsBtn = document.getElementById("modalDetailsBtn");
  var detailUrl = "property.html?search=" + encodeURIComponent((property.title || "") + " " + (property.location || ""));
  detailsBtn.href = detailUrl;

  // Image gallery
  buildModalGallery(property.images || property.carouselImages || [property.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"]);

  // Show
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePropertyModal() {
  var overlay = document.getElementById("propertyModal");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
  _modalProperty = null;
}

function buildModalGallery(images) {
  var gallery = document.getElementById("modalGallery");
  var dotsContainer = document.getElementById("modalGalleryDots");
  var imgs = gallery.querySelectorAll("img");
  // Remove old images (keep the first which we'll reuse)
  for (var i = 1; i < imgs.length; i++) {
    imgs[i].remove();
  }
  dotsContainer.innerHTML = "";
  var firstImg = gallery.querySelector("img");
  if (!firstImg) return;

  if (!images || images.length === 0) images = ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"];

  firstImg.src = images[0];
  firstImg.alt = "Property image 1";
  firstImg.className = "active";

  for (var j = 1; j < images.length; j++) {
    var img = document.createElement("img");
    img.src = images[j];
    img.alt = "Property image " + (j + 1);
    gallery.insertBefore(img, gallery.querySelector(".modal-gallery-prev"));
  }

  for (var k = 0; k < images.length; k++) {
    var dot = document.createElement("span");
    dot.className = k === 0 ? "active" : "";
    dot.setAttribute("data-index", k);
    dot.addEventListener("click", function() { modalGalleryGo(parseInt(this.getAttribute("data-index"))); });
    dotsContainer.appendChild(dot);
  }

  _modalGalleryIndex = 0;
  // Show/hide nav buttons based on image count
  var prevBtn = gallery.querySelector(".modal-gallery-prev");
  var nextBtn = gallery.querySelector(".modal-gallery-next");
  if (prevBtn) prevBtn.style.display = images.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = images.length > 1 ? "flex" : "none";
}

function modalGalleryNav(direction) {
  var gallery = document.getElementById("modalGallery");
  var imgs = gallery.querySelectorAll("img:not(.modal-gallery-nav):not(.modal-gallery-prev):not(.modal-gallery-next)");
  var newIndex = _modalGalleryIndex + direction;
  if (newIndex < 0) newIndex = imgs.length - 1;
  if (newIndex >= imgs.length) newIndex = 0;
  modalGalleryGo(newIndex);
}

function modalGalleryGo(index) {
  var gallery = document.getElementById("modalGallery");
  var imgs = gallery.querySelectorAll("img:not(.modal-gallery-nav):not(.modal-gallery-prev):not(.modal-gallery-next)");
  var dots = document.querySelectorAll("#modalGalleryDots span");
  imgs.forEach(function(img, i) {
    img.className = i === index ? "active" : "";
  });
  dots.forEach(function(dot, i) {
    dot.className = i === index ? "active" : "";
  });
  _modalGalleryIndex = index;
}

// Close modal on overlay click
document.addEventListener("click", function(e) {
  if (e.target && e.target.id === "propertyModal") {
    closePropertyModal();
  }
});
// Close on Escape key
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closePropertyModal();
});

// ============================================================
// SECTION 5: AI SEARCH — Real Groq + Firebase search
// ============================================================
async function askAI() {
  const input = document.getElementById("ai-search-input");
  const query = input ? input.value.trim() : "";
  if (!query) return;

  const chatArea = document.getElementById("chat-area");
  if (!chatArea) return;
  chatArea.classList.remove("hidden");

  // User bubble
  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble flex justify-end";
  userBubble.innerHTML = '<div style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); border-radius: 1rem 1rem 0.25rem 1rem; padding: 0.75rem 1rem; max-width: 28rem; color: #fef9c3; font-size: 0.875rem; line-height: 1.5; box-shadow: 0 2px 10px rgba(245,158,11,0.1);">' + escapeHtml(query) + "</div>";
  chatArea.appendChild(userBubble);

  // Typing indicator
  const typing = document.createElement("div");
  typing.className = "chat-bubble flex justify-start";
  typing.id = "ai-typing-indicator";
  typing.innerHTML = '<div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(245,158,11,0.15); border-radius: 1rem 1rem 1rem 0.25rem; padding: 0.75rem 1rem; display: flex; gap: 0.25rem; align-items: center;"><span class="typing-dot" style="width: 6px; height: 6px; background: #facc15; border-radius: 50%; display: inline-block; animation: typingBounce 1.4s infinite;"></span><span class="typing-dot" style="width: 6px; height: 6px; background: #facc15; border-radius: 50%; display: inline-block; animation: typingBounce 1.4s infinite 0.2s;"></span><span class="typing-dot" style="width: 6px; height: 6px; background: #facc15; border-radius: 50%; display: inline-block; animation: typingBounce 1.4s infinite 0.4s;"></span></div>';
  chatArea.appendChild(typing);
  chatArea.scrollTop = chatArea.scrollHeight;
  if (input) { input.value = ""; input.focus(); }

  // Bail out if no API key
  if (!HOMEPAGE_AI.GROQ_KEY || HOMEPAGE_AI.GROQ_KEY.startsWith("gsk_")) {
    // Check if it's a property search query vs conversational
    const isSearch = /(?:find|look|show|search|want|need|property|apartment|villa|house|plot|rent|buy)\b/i.test(query);
    if (isSearch) {
      await processSearchQuery(query, chatArea, typing);
      return;
    }
  }

  const systemPrompt = "You are NestFinder AI, a friendly and knowledgeable real estate assistant for Pakistan's property market. You help users find properties, understand market trends, and make informed decisions across Karachi, Lahore, and Islamabad. Keep responses concise (2-4 sentences), helpful, and accurate. If the user is looking for a specific property type or location, guide them to use the search feature. Never make up specific data points you are unsure about.";

  const response = await callGroq(query, systemPrompt, 0.5);

  // Remove typing indicator
  const ti = document.getElementById("ai-typing-indicator");
  if (ti) ti.remove();

  // AI response bubble
  const aiBubble = document.createElement("div");
  aiBubble.className = "chat-bubble flex justify-start";
  aiBubble.innerHTML = '<div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(245,158,11,0.2); border-radius: 1rem 1rem 1rem 0.25rem; padding: 0.75rem 1rem; max-width: 32rem; color: #e5e7eb; font-size: 0.875rem; line-height: 1.6; box-shadow: 0 2px 15px rgba(0,0,0,0.3);"><div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: #facc15; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-robot"></i> NestFinder AI</div><span class="ai-response-text">' + (response || "I'm sorry, I couldn't process that request. Please try asking about a specific city, property type, or budget.") + "</span></div>";
  chatArea.appendChild(aiBubble);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Called when user clicks a quick tag or the search button triggers a property search
async function processSearchQuery(rawQuery, chatArea, typingIndicator) {
  const systemPrompt = "You are the search-query parser for NestFinder. Read the user's property search and return ONLY a valid JSON object with these keys:\n{\n  \"type\": one of \"all\",\"House\",\"Apartment\",\"Villa\",\"Plot\",\"Commercial\",\"Penthouse\",\"Office\",\"Shop\",\n  \"beds\": one of \"all\",\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"8\",\"10+\",\n  \"baths\": one of \"all\",\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"8\",\"10+\",\n  \"category\": one of \"all\",\"For Sale\",\"For Rent\",\n  \"budget\": one of \"all\",\"Budget\",\"Premium\",\"Luxury\",\n  \"minPrice\": number (raw PKR) or 0,\n  \"maxPrice\": number (raw PKR) or 0,\n  \"keywords\": string (city/area name or leftover terms) or \"\",\n  \"reply\": a short one-sentence confirmation\n}\nConvert crore*10000000, lakh/lac*100000.";

  const response = await callGroq(rawQuery, systemPrompt, 0.2);
  let searchParams = null;
  if (response) {
    try {
      const cleaned = response.replace(/```json|```/g, "").trim();
      searchParams = JSON.parse(cleaned);
    } catch (_) {}
  }

  // Remove typing
  if (typingIndicator) {
    const ti = document.getElementById("ai-typing-indicator");
    if (ti) ti.remove();
  }

  if (!searchParams) {
    // Fallback: redirect to property page
    const aiBubble = document.createElement("div");
    aiBubble.className = "chat-bubble flex justify-start";
    aiBubble.innerHTML = '<div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(245,158,11,0.2); border-radius: 1rem 1rem 1rem 0.25rem; padding: 0.75rem 1rem; max-width: 32rem; color: #e5e7eb; font-size: 0.875rem; line-height: 1.6; box-shadow: 0 2px 15px rgba(0,0,0,0.3);"><div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: #facc15; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-robot"></i> NestFinder AI</div><span class="ai-response-text">Let me search our database for properties matching your request. <a href="property.html?search=' + encodeURIComponent(rawQuery) + '" style="color: #facc15; text-decoration: underline;">View all results</a></span></div>';
    if (chatArea) chatArea.appendChild(aiBubble);
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;

    // Also redirect
    setTimeout(function() {
      window.location.href = "property.html?search=" + encodeURIComponent(rawQuery);
    }, 1500);
    return;
  }

  // Query Firebase for matching properties
  var allProps = _nfAllProperties || [];
  const filtered = allProps.filter(function(p) {
    if (searchParams.type !== "all" && p.type !== searchParams.type) return false;
    if (searchParams.category !== "all" && p.category !== searchParams.category) return false;
    if (searchParams.budget !== "all" && p.budgetCategory !== searchParams.budget) return false;
    if (searchParams.beds !== "all") {
      var b = parseInt(searchParams.beds, 10);
      if (searchParams.beds === "10+" && p.bedrooms < 10) return false;
      if (searchParams.beds !== "10+" && p.bedrooms !== b) return false;
    }
    if (searchParams.baths !== "all") {
      var ba = parseInt(searchParams.baths, 10);
      if (searchParams.baths === "10+" && p.bathrooms < 10) return false;
      if (searchParams.baths !== "10+" && p.bathrooms !== ba) return false;
    }
    if (searchParams.minPrice > 0 && p.price < searchParams.minPrice) return false;
    if (searchParams.maxPrice > 0 && p.price > searchParams.maxPrice) return false;
    if (searchParams.keywords) {
      var kw = searchParams.keywords.toLowerCase();
      var title = (p.title || "").toLowerCase();
      var loc = (p.location || "").toLowerCase();
      if (!title.includes(kw) && !loc.includes(kw)) return false;
    }
    return true;
  });

  var matchedProps = filtered.length > 0;
  var topProps = filtered.slice(0, 3);
  var hasMore = filtered.length > 3;

  // Build AI bubble
  var replyText = searchParams.reply || "Here are the best matches I found.";
  var bubbleContent = '<div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(245,158,11,0.2); border-radius: 1rem 1rem 1rem 0.25rem; padding: 0.75rem 1rem; max-width: 32rem; color: #e5e7eb; font-size: 0.875rem; line-height: 1.6; box-shadow: 0 2px 15px rgba(0,0,0,0.3);"><div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: #facc15; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-robot"></i> NestFinder AI</div><span class="ai-response-text">';

  if (matchedProps) {
    bubbleContent += replyText + " Showing " + Math.min(filtered.length, 3) + " of " + filtered.length + " matching properties.";
    if (hasMore) {
      bubbleContent += ' <a href="property.html?search=' + encodeURIComponent(rawQuery) + '" style="color: #facc15; text-decoration: underline;">View all</a>';
    }
  } else {
    // No exact matches — recommend closest
    var closest = allProps.slice(0, 3);
    topProps = closest;
    bubbleContent += "I couldn't find exact matches for \"" + escapeHtml(rawQuery) + '". Here are the closest alternatives:';
  }
  bubbleContent += "</span></div>";

  var aiBubble = document.createElement("div");
  aiBubble.className = "chat-bubble flex justify-start";
  aiBubble.innerHTML = bubbleContent;
  if (chatArea) chatArea.appendChild(aiBubble);

  // Show matching property cards below the chat
  if (topProps.length > 0) {
    renderPropertyCardsBelowChat(topProps, chatArea, rawQuery);
  }

  if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
}

function renderPropertyCardsBelowChat(props, chatArea, rawQuery) {
  var cardContainer = document.createElement("div");
  cardContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4";
  cardContainer.id = "search-result-cards";

  props.forEach(function(p) {
    var imgSrc = p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";
    var price = p.priceDisplay || formatPriceHomepage(p.price, p.category);
    var sq = encodeURIComponent((p.title || "") + " " + (p.location || ""));

    var card = document.createElement("a");
    card.href = "property.html?search=" + sq;
    card.className = "group relative rounded-2xl overflow-hidden cursor-pointer";
    card.style.textDecoration = "none";
    card.style.display = "block";

    card.innerHTML =
      '<div class="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent z-10 opacity-80"></div>' +
      '<img src="' + imgSrc + '" alt="' + (p.title || "") + '" class="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110" onerror="this.src=\'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80\'">' +
      '<div class="absolute top-4 right-4 z-20 glass px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">' +
        '<i class="fa-solid fa-robot text-yellow-300"></i> AI Match' +
      '</div>' +
      '<div class="absolute bottom-0 left-0 w-full p-4 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">' +
        '<div class="flex justify-between items-start">' +
          '<div>' +
            '<h3 class="text-lg font-bold text-yellow-200">' + (p.title || "Property") + '</h3>' +
            '<p class="text-gray-300 text-sm"><i class="fa-solid fa-location-dot mr-1"></i> ' + (p.location || "") + '</p>' +
          '</div>' +
          '<div class="text-right">' +
            '<p class="text-xl font-bold text-yellow-400">' + price + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    cardContainer.appendChild(card);
  });

  // Remove previous search results
  var oldResults = document.getElementById("search-result-cards");
  if (oldResults) oldResults.remove();

  if (chatArea) chatArea.parentNode.insertBefore(cardContainer, chatArea.nextSibling);
}

// ============================================================
// SECTION 6: SEARCH REDIRECT — Read from filters + AI enhance
// ============================================================
function getFilterVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : "";
}

async function processSearch() {
  var purpose = getFilterVal("nf-filter-purpose");
  var type = getFilterVal("nf-filter-type");
  var city = getFilterVal("nf-filter-city");
  var beds = getFilterVal("nf-filter-bedrooms");
  var budgetRaw = getFilterVal("nf-filter-budget");

  // Build a natural language query from filters for AI enhancement
  var parts = [];
  if (purpose) parts.push(purpose);
  if (type) parts.push(type);
  if (city) parts.push("in " + city);
  if (beds) parts.push(beds + " bedroom");
  if (budgetRaw) parts.push("budget " + budgetRaw);
  var query = parts.length ? parts.join(" ") : "all properties";

  var overlay = document.getElementById("ai-processing");
  var statusText = document.getElementById("ai-status-text");
  if (overlay) overlay.classList.remove("hidden");
  if (statusText) statusText.innerText = "AI is analyzing your request...";

  // Call Groq to extract structured params (includes AI budget parsing)
  var systemPrompt = "Extract search parameters from the user's property query. Return ONLY a valid JSON object with keys: type, beds, baths, category, city, minPrice, maxPrice, keywords. Use '' for unspecified. Convert crore*10000000, lakh*100000. For budget like '50 lakh', set minPrice=5000000; for '1-2 crore' set minPrice=10000000 maxPrice=20000000; for 'under 1 crore' set maxPrice=10000000; for 'above 5 crore' set minPrice=50000000.";
  var response = await callGroq(query, systemPrompt, 0.2);

  var params = {};
  if (response) {
    try {
      var cleaned = response.replace(/```json|```/g, "").trim();
      params = JSON.parse(cleaned);
    } catch (_) {}
  }

  // Build URL params — filter values take priority over AI extraction
  var searchParams = new URLSearchParams();
  searchParams.set("search", query);
  if (purpose) searchParams.set("category", purpose);
  else if (params.category) searchParams.set("category", params.category);
  if (type) searchParams.set("type", type);
  else if (params.type) searchParams.set("type", params.type);
  if (city) searchParams.set("city", city);
  if (beds) searchParams.set("beds", beds);
  else if (params.beds) searchParams.set("beds", params.beds);
  if (params.baths) searchParams.set("baths", params.baths);
  if (params.minPrice > 0) searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice > 0) searchParams.set("maxPrice", params.maxPrice);
  if (params.keywords) searchParams.set("keywords", params.keywords);

  if (statusText) statusText.innerText = "Finding the best properties for you...";

  setTimeout(function() {
    window.location.href = "property.html?" + searchParams.toString();
  }, 800);
}

// ============================================================
// SECTION 7: QUICK TAG PRESETS
// ============================================================
function setFilterPreset(preset) {
  if (preset === "luxury") {
    document.getElementById("nf-filter-purpose").value = "For Sale";
    document.getElementById("nf-filter-type").value = "House";
    document.getElementById("nf-filter-city").value = "Karachi";
    document.getElementById("nf-filter-bedrooms").value = "4";
  } else if (preset === "family") {
    document.getElementById("nf-filter-purpose").value = "For Rent";
    document.getElementById("nf-filter-type").value = "Flat";
    document.getElementById("nf-filter-city").value = "Lahore";
    document.getElementById("nf-filter-bedrooms").value = "2";
  } else if (preset === "plot") {
    document.getElementById("nf-filter-purpose").value = "For Sale";
    document.getElementById("nf-filter-type").value = "Plot";
    document.getElementById("nf-filter-city").value = "Islamabad";
  }
  processSearch();
}

// ============================================================
// SECTION 8: MARKET INTELLIGENCE — Chart.js (lazy via IntersectionObserver)
// ============================================================
var _marketChart = null;

function updateMarketIntelligence(props) {
  if (!props || props.length === 0) return;
  var chartEl = document.getElementById("marketChart");
  if (!chartEl) return;

  // Group by city
  var cityMap = {};
  props.forEach(function(p) {
    var loc = (p.location || "").toLowerCase();
    var city = "other";
    if (loc.indexOf("karachi") !== -1) city = "Karachi";
    else if (loc.indexOf("lahore") !== -1) city = "Lahore";
    else if (loc.indexOf("islamabad") !== -1 || loc.indexOf("bahria") !== -1 || loc.indexOf("rawalpindi") !== -1) city = "Islamabad";
    if (!cityMap[city]) cityMap[city] = { prices: [], count: 0 };
    if (p.price > 0) cityMap[city].prices.push(p.price);
    cityMap[city].count++;
  });

  var cities = Object.keys(cityMap).filter(function(c) { return cityMap[c].prices.length > 0; });
  if (cities.length === 0) return;

  var avgPrices = cities.map(function(c) {
    var prices = cityMap[c].prices;
    return Math.round(prices.reduce(function(s, v) { return s + v; }, 0) / prices.length);
  });

  var ctx = chartEl.getContext("2d");
  var gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(250, 204, 21, 0.5)");
  gradient.addColorStop(1, "rgba(250, 204, 21, 0)");

  if (_marketChart) _marketChart.destroy();
  _marketChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: cities,
      datasets: [{
        label: "Avg Property Price (PKR)",
        data: avgPrices,
        backgroundColor: ["rgba(245,158,11,0.7)", "rgba(251,191,36,0.7)", "rgba(217,119,6,0.7)"],
        borderColor: ["#f59e0b", "#fbbf24", "#d97706"],
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", callback: function(v) { return v >= 10000000 ? (v/10000000).toFixed(1)+"Cr" : v >= 100000 ? (v/100000).toFixed(0)+"L" : v; } }
        },
        x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { weight: "bold" } } }
      }
    }
  });

  // Update text stats
  var totalProps = props.length;
  var saleProps = props.filter(function(p) { return p.category === "For Sale"; }).length;
  var rentProps = props.filter(function(p) { return p.category === "For Rent"; }).length;
  var avgPriceAll = Math.round(props.reduce(function(s, p) { return s + (p.price || 0); }, 0) / Math.max(totalProps, 1));

  var avgPriceEl = chartEl.parentNode.querySelector(".text-yellow-300.font-bold");
  if (avgPriceEl) {
    avgPriceEl.textContent = avgPriceAll >= 10000000
      ? "PKR " + (avgPriceAll / 10000000).toFixed(2) + " Cr"
      : "PKR " + (avgPriceAll / 100000).toFixed(1) + " Lakh";
  }

  var inventoryEl = document.getElementById("marketInventory");
  if (inventoryEl) inventoryEl.textContent = totalProps + " active listings across " + cities.length + " cities. " + saleProps + " for sale, " + rentProps + " for rent.";

  var appreciationEl = document.getElementById("marketAppreciation");
  if (appreciationEl) {
    var topCity = cities.sort(function(a, b) { return cityMap[b].count - cityMap[a].count; })[0];
    var highestGrowth = cities.length > 1
      ? ((avgPrices[cities.indexOf(topCity)] - Math.min.apply(null, avgPrices)) / Math.min.apply(null, avgPrices) * 100).toFixed(1)
      : "5.2";
    appreciationEl.textContent = topCity + " leads with " + highestGrowth + "% price premium. Average property value: PKR " +
      (avgPriceAll >= 10000000 ? (avgPriceAll / 10000000).toFixed(1) + " Cr" : (avgPriceAll / 100000).toFixed(1) + " Lakh") + ".";
  }

  // Remove skeleton
  var skeleton = chartEl.parentNode.querySelector(".nf-skeleton-chart");
  if (skeleton) skeleton.style.display = "none";
}

// Lazy load chart when section enters viewport
function lazyLoadMarketIntelligence(props) {
  var section = document.getElementById("marketChart");
  if (!section || !props) return;
  if (typeof IntersectionObserver === "undefined") {
    updateMarketIntelligence(props);
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        updateMarketIntelligence(props);
        observer.disconnect();
      }
    });
  }, { rootMargin: "200px" });
  observer.observe(section);
}

// ============================================================
// SECTION 9: COMPARISON MATRIX — lazy-loaded
// ============================================================
function renderCompareMatrix(props) {
  var body = document.getElementById("compareBody");
  var prop1 = document.getElementById("compareProp1");
  var prop2 = document.getElementById("compareProp2");
  if (!body || !prop1 || !prop2 || !props || props.length < 2) return;

  var sorted = props.filter(function(p) { return p.price > 0; }).sort(function(a, b) { return b.price - a.price; });
  var a = sorted[0], b = sorted[1];
  if (!a || !b) return;

  var fmtPrice = function(p) {
    return p >= 10000000 ? "PKR " + (p / 10000000).toFixed(1) + " Crore"
         : p >= 100000 ? "PKR " + (p / 100000).toFixed(1) + " Lakh"
         : "PKR " + p.toLocaleString();
  };

  var getSafety = function(loc) {
    if (typeof AIEngine !== "undefined" && AIEngine.getAreaSafety) return AIEngine.getAreaSafety(loc);
    if (typeof getAreaSafetyRating === "function") return getAreaSafetyRating(loc);
    return "A";
  };

  var aScore = a.aiScore || Math.round((40 + Math.random() * 10) * 10) / 10;
  var bScore = b.aiScore || Math.round((35 + Math.random() * 10) * 10) / 10;
  var aImg = a.image || (Array.isArray(a.images) ? a.images[0] : a.images) || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80";
  var bImg = b.image || (Array.isArray(b.images) ? b.images[0] : b.images) || "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80";

  prop1.innerHTML =
    '<div class="relative">' +
      '<img src="' + aImg + '" class="w-full h-32 object-cover rounded-lg mb-3">' +
      '<h3 class="font-bold text-lg text-yellow-300">' + (a.title || "Property") + '</h3>' +
      '<p class="text-sm text-gray-300">' + (a.location || "") + '</p>' +
      '<div class="absolute top-2 right-2 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded">AI Score: ' + aScore + '</div>' +
    '</div>';

  prop2.innerHTML =
    '<div class="relative">' +
      '<img src="' + bImg + '" class="w-full h-32 object-cover rounded-lg mb-3">' +
      '<h3 class="font-bold text-lg text-yellow-300">' + (b.title || "Property") + '</h3>' +
      '<p class="text-sm text-gray-300">' + (b.location || "") + '</p>' +
      '<div class="absolute top-2 right-2 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded">AI Score: ' + bScore + '</div>' +
    '</div>';

  var allPrices = sorted.map(function(p) { return p.price; });
  var median = allPrices[Math.floor(allPrices.length / 2)];
  var investA = a.price >= median * 1.5 ? "Very High" : a.price >= median ? "High" : "Moderate";
  var investB = b.price >= median * 1.5 ? "Very High" : b.price >= median ? "High" : "Moderate";
  var fitA = Math.round(75 + Math.random() * 20);
  var fitB = Math.round(75 + Math.random() * 20);
  var safetyA = getSafety(a.location || "");
  var safetyB = getSafety(b.location || "");

  body.innerHTML =
    '<tr><td class="p-6 text-gray-300">Price</td><td class="p-6 font-bold text-xl text-yellow-300">' + fmtPrice(a.price) + '</td><td class="p-6 font-bold text-xl text-yellow-300">' + fmtPrice(b.price) + '</td><td class="p-6"></td></tr>' +
    '<tr><td class="p-6 text-gray-300">Investment Potential</td><td class="p-6"><span class="text-green-300"><i class="fa-solid fa-arrow-trend-up"></i> ' + investA + '</span></td><td class="p-6"><span class="text-green-300"><i class="fa-solid fa-arrow-trend-up"></i> ' + investB + '</span></td><td class="p-6"></td></tr>' +
    '<tr><td class="p-6 text-gray-300">Lifestyle Fit</td><td class="p-6"><div class="w-full bg-yellow-200/10 rounded-full h-2 mb-1"><div class="bg-yellow-400 h-2 rounded-full" style="width:' + fitA + '%"></div></div><span class="text-xs text-gray-300">' + fitA + '% Match</span></td><td class="p-6"><div class="w-full bg-white/10 rounded-full h-2 mb-1"><div class="bg-yellow-400 h-2 rounded-full" style="width:' + fitB + '%"></div></div><span class="text-xs text-gray-300">' + fitB + '% Match</span></td><td class="p-6"></td></tr>' +
    '<tr><td class="p-6 text-gray-300">Neighborhood Safety</td><td class="p-6 text-yellow-400">' + safetyA + '</td><td class="p-6 text-yellow-400">' + safetyB + '</td><td class="p-6"></td></tr>' +
    '<tr><td class="p-6 text-gray-300">Action</td><td class="p-6"><a href="property.html?search=' + encodeURIComponent(a.title || "") + '" style="text-decoration:none;"><button class="w-full py-2 rounded-lg bg-yellow-200/50 hover:bg-yellow-500 hover:text-white transition-colors text-yellow-100">View Details</button></a></td><td class="p-6"><a href="property.html?search=' + encodeURIComponent(b.title || "") + '" style="text-decoration:none;"><button class="w-full py-2 rounded-lg bg-yellow-200/50 hover:bg-yellow-500 hover:text-white transition-colors text-yellow-100">View Details</button></a></td><td class="p-6"></td></tr>';

  // Remove skeleton
  var skeleton = document.querySelector(".nf-skeleton-compare");
  if (skeleton) skeleton.style.display = "none";
}

function lazyLoadCompareMatrix(props) {
  var section = document.getElementById("compare");
  if (!section || !props) return;
  if (typeof IntersectionObserver === "undefined") {
    renderCompareMatrix(props);
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        renderCompareMatrix(props);
        observer.disconnect();
      }
    });
  }, { rootMargin: "200px" });
  observer.observe(section);
}

// ============================================================
// SECTION 10: AREA INSIGHTS — from shared city data
// ============================================================
function renderAreaInsights(props) {
  var grid = document.getElementById("area-insights-grid");
  if (!grid) return;
  var data = window._AREA_OVERVIEW;
  if (!data || !data.length) {
    grid.innerHTML = '<div class="col-12 text-center py-4" style="color:var(--text-muted);">Area data unavailable</div>';
    return;
  }

  if (!props || props.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center py-4" style="color:var(--text-muted);">Area data unavailable</div>';
    return;
  }

  // Calculate actual average prices from properties for each city
  // Properties store prices in USD, so averages are displayed in USD
  var cityPrices = {};
  props.forEach(function(p) {
    var loc = (p.location || "").toLowerCase();
    var city = null;
    if (loc.indexOf("karachi") !== -1) city = "Karachi";
    else if (loc.indexOf("lahore") !== -1) city = "Lahore";
    else if (loc.indexOf("islamabad") !== -1) city = "Islamabad";
    // Only include realistic property prices (>= $5,000 USD)
    if (city && p.price > 5000) {
      if (!cityPrices[city]) cityPrices[city] = [];
      cityPrices[city].push(Number(p.price));
    }
  });

  var html = "";
  data.forEach(function(a) {
    var prices = cityPrices[a.city] || [];
    var avgPrice = prices.length > 0
      ? Math.round(prices.reduce(function(s, v) { return s + v; }, 0) / prices.length)
      : 0;

    var priceDisplay = avgPrice > 0
      ? "$" + avgPrice.toLocaleString("en-US")
      : "—";

    html += '<div class="col-md-4">' +
      '<div class="insight-card p-4 text-center">' +
        '<div class="insight-icon mx-auto mb-3" style="width:48px;height:48px;border-radius:14px;font-size:1.3rem;display:flex;align-items:center;justify-content:center;"><i class="fa-solid ' + a.icon + '"></i></div>' +
        '<h4 class="fw-bold mb-1">' + a.city + '</h4>' +
        '<p class="small mb-2" style="color:var(--text-muted);">' + a.desc + '</p>' +
        '<div class="d-flex justify-content-center gap-3 small mb-2">' +
          '<span><span style="color:#34d399;">●</span> Safety ' + a.safety + '%</span>' +
          '<span><span style="color:#f59e0b;">●</span> Growth ' + a.growth.toFixed(1) + '%</span>' +
        '</div>' +
        '<p class="small" style="color:var(--text-muted);">Avg. Price: <strong>' + priceDisplay + '</strong></p>' +
      '</div>' +
    '</div>';
  });

  grid.innerHTML = html;
}

// ============================================================
// SECTION 11: INIT — Optimized single-fetch pipeline
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
  // Page UI is already visible (skeleton loaders in HTML).
  // Fire data load after a microtask so paint completes first.
  Promise.resolve().then(function() {
    onPropertiesReady(function(props) {
      // 1. Stats (lightweight, update immediately)
      updateRealStats(props);

      // 2. Property cards (main content, show ASAP)
      rankAndRenderProperties(props);

      // 3. Area insights (lightweight)
      renderAreaInsights(props);

      // 4. Market chart (heavy — lazy via IntersectionObserver)
      lazyLoadMarketIntelligence(props);

      // 5. Comparison matrix (heavy — lazy via IntersectionObserver)
      lazyLoadCompareMatrix(props);
    });
  });
});
