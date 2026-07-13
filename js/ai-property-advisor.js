(function () {
  "use strict";

  var CONFIG = {
    MAX_CHAT_HISTORY: 20,
    SEARCH_DEBOUNCE: 300,
    PRICE_EXPAND_PCT: 0.10,
    NEARBY_AREAS_FALLBACK: true,
    SIMILAR_TYPES_FALLBACK: true
  };

  var ZENSERP_FN_URL = (typeof AI_CONFIG !== "undefined" && AI_CONFIG.ZENSERP_FUNCTION_URL) ||
    "https://zenserpsearch-xxxxxxxxxx-uc.a.run.app";

  var chatHistory = [];
  var allProperties = [];
  var isSearching = false;
  var lastParams = null;

  var DOM = {};

  function cacheDOM() {
    DOM.chat = document.getElementById("advisorChat");
    DOM.input = document.getElementById("advisorInput");
    DOM.sendBtn = document.getElementById("advisorSendBtn");
    DOM.container = document.getElementById("advisorContainer");
  }

  function formatPrice(n, category) {
    if (!n) return "";
    if (category === "For Rent") {
      return n >= 100000
        ? "PKR " + (n / 100000).toFixed(1) + " Lakh/mo"
        : "PKR " + n.toLocaleString() + "/mo";
    }
    return n >= 10000000
      ? "PKR " + (n / 10000000).toFixed(2) + " Crore"
      : "PKR " + (n / 100000).toFixed(1) + " Lakh";
  }

  function getPropertyArea(location) {
    if (!location) return "";
    var parts = location.split(",").map(function (s) { return s.trim(); });
    return parts[0] || "";
  }

  function getPropertyCity(location) {
    if (!location) return "";
    var parts = location.split(",").map(function (s) { return s.trim(); });
    return parts[parts.length - 1] || "";
  }

  function addMessage(type, content) {
    if (!DOM.chat) return;
    var wrapper = document.createElement("div");
    wrapper.className = "advisor-msg advisor-msg-" + type;
    wrapper.innerHTML = content;
    DOM.chat.appendChild(wrapper);
    DOM.chat.scrollTop = DOM.chat.scrollHeight;
    chatHistory.push({ type: type, content: content });
    if (chatHistory.length > CONFIG.MAX_CHAT_HISTORY) {
      chatHistory.shift();
    }
  }

  function addTypingIndicator() {
    if (!DOM.chat) return;
    var el = document.createElement("div");
    el.className = "advisor-msg advisor-msg-bot advisor-typing";
    el.id = "advisorTyping";
    el.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    DOM.chat.appendChild(el);
    DOM.chat.scrollTop = DOM.chat.scrollHeight;
  }

  function removeTypingIndicator() {
    var el = document.getElementById("advisorTyping");
    if (el) el.remove();
  }

  function setLoading(state) {
    isSearching = state;
    if (DOM.sendBtn) {
      DOM.sendBtn.disabled = state;
      DOM.sendBtn.innerHTML = state
        ? '<span class="spinner-border spinner-border-sm"></span>'
        : '<i class="bi bi-send-fill"></i>';
    }
    if (DOM.input) DOM.input.disabled = state;
  }

  function showError(msg) {
    addMessage("error", '<div class="advisor-error"><i class="bi bi-exclamation-triangle-fill me-2"></i>' + msg + "</div>");
  }

  function addQuickActions(buttons) {
    if (!DOM.chat) return;
    var wrapper = document.createElement("div");
    wrapper.className = "advisor-actions";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.className = "advisor-action-btn";
      btn.innerHTML = b.icon ? '<i class="bi bi-' + b.icon + ' me-1"></i>' + b.label : b.label;
      btn.addEventListener("click", b.action);
      wrapper.appendChild(btn);
    });
    DOM.chat.appendChild(wrapper);
    DOM.chat.scrollTop = DOM.chat.scrollHeight;
  }

  function propertyToCard(p, matchReason, score) {
    var img = p.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";
    var statusBadge = p.status && p.status !== "Active"
      ? '<span class="prop-badge status-' + p.status.toLowerCase() + '">' + p.status + "</span>"
      : "";
    var bedSpec = p.bedrooms > 0 ? '<span><i class="bi bi-bed-fill"></i>' + p.bedrooms + " Bed</span>" : "";
    var bathSpec = p.bathrooms > 0 ? '<span><i class="bi bi-water"></i>' + p.bathrooms + " Bath</span>" : "";
    var areaSpec = p.area ? '<span><i class="bi bi-rulers"></i>' + p.area + "</span>" : "";

    var detailPage = "listing.html?id=" + (p.firebaseKey || p.id);

    return (
      '<div class="advisor-property-card">' +
        '<div class="advisor-prop-img-wrap">' +
          '<img src="' + img + '" alt="' + (p.title || "") + '" class="advisor-prop-img" onerror="this.src=\'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80\'">' +
          '<div class="advisor-prop-badges">' +
            '<span class="prop-badge type">' + (p.type || "Property") + "</span>" +
            '<span class="prop-badge category">' + (p.category || "") + "</span>" +
            statusBadge +
          "</div>" +
          (score ? '<div class="advisor-match-score"><span>' + score + "%</span> Match</div>" : "") +
        "</div>" +
        '<div class="advisor-prop-body">' +
          '<div class="advisor-prop-price">' + formatPrice(p.price, p.category) + "</div>" +
          '<div class="advisor-prop-title">' + (p.title || "") + "</div>" +
          '<div class="advisor-prop-loc"><i class="bi bi-geo-alt-fill" style="color:#f59e0b"></i> ' + (p.location || "") + "</div>" +
          '<div class="advisor-prop-specs">' + bedSpec + bathSpec + areaSpec + "</div>" +
          (matchReason ? '<div class="advisor-prop-reason"><i class="bi bi-check-circle-fill me-1" style="color:#22c55e"></i>' + matchReason + "</div>" : "") +
          '<a href="' + detailPage + '" class="btn btn-outline-warning btn-sm w-100 fw-bold mt-2 py-2">' +
            '<i class="bi bi-info-circle me-1"></i> View Details' +
          "</a>" +
        "</div>" +
      "</div>"
    );
  }

  function searchDuckDuckGo(query) {
    var proxyUrl = (typeof AI_CONFIG !== "undefined" && AI_CONFIG.ZENSERP_FUNCTION_URL) || "http://localhost:3001/api/zenserp";
    return fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, params: {} })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Local proxy error: " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      })
      .catch(function (err) {
        console.error("DuckDuckGo fallback error:", err);
        return [];
      });
  }

  function tryLocalProxy(query) {
    var proxyUrl = (typeof AI_CONFIG !== "undefined" && AI_CONFIG.ZENSERP_FUNCTION_URL) || "http://localhost:3001/api/zenserp";
    return fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, params: {} })
    })
    .then(function (res) {
      if (!res.ok) throw new Error("Proxy error: " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    })
    .catch(function (err) {
      console.error("Local proxy failed, trying DuckDuckGo fallback:", err);
      return searchDuckDuckGo(query);
    });
  }

  function searchWeb(params) {
    var workerUrl = (typeof AI_CONFIG !== "undefined" && AI_CONFIG.ZENSERP_FUNCTION_URL) || "https://nestfinder-search.nestfinder.workers.dev/api/search";
    var query = params.query || buildWebSearchQuery(params);

    return fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, params: params })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Search error: " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.results)) return [];
        return data.results.slice(0, 12).filter(function (r) {
          // Only include results that match the requested city
          if (params.city) {
            var titleAndDesc = ((r.title || "") + " " + (r.description || "")).toLowerCase();
            var requestedCity = params.city.toLowerCase();
            if (titleAndDesc.indexOf(requestedCity) === -1) return false;
          }
          return true;
        }).slice(0, 6).map(function (r) {
          return {
            title: r.title || "",
            url: r.url || "",
            source: r.source || "",
            description: r.description || "",
            _webResult: true
          };
        });
      })
      .catch(function (err) {
        console.error("Worker search failed:", err);
        return [];
      });
  }

  function buildWebSearchQuery(params) {
    var parts = [];
    var SEARCH_SITES = ["zameen.com", "graana.com", "olx.com.pk", "lamudi.pk"];
    var siteFilter = SEARCH_SITES.map(function (s) { return "site:" + s; }).join(" OR ");
    if (params.type && params.type !== "all" && params.type !== "") parts.push('"' + params.type + '"');
    if (params.bedrooms > 0) parts.push(params.bedrooms + " bedroom");
    if (params.area) parts.push('"' + params.area + '"');
    if (params.city) parts.push('"' + params.city + '"');
    if (params.maxPrice > 0) parts.push('"' + formatPrice(params.maxPrice) + '"');
    if (params.minPrice > 0) parts.push('"' + formatPrice(params.minPrice) + '"');
    if (params.bathrooms > 0) parts.push(params.bathrooms + " bathroom");
    if (parts.length === 0) parts.push("property for sale");
    return siteFilter + " " + parts.join(" ");
  }

  function webResultToCard(r) {
    var hostname = r.source || "";
    var favicon = "https://www.google.com/s2/favicons?domain=" + hostname + "&sz=32";
    return (
      '<div class="advisor-property-card advisor-web-card">' +
        '<div class="advisor-prop-body">' +
          '<div class="advisor-web-source">' +
            '<img src="' + favicon + '" width="16" height="16" alt="" style="border-radius:3px;margin-right:6px;vertical-align:middle" onerror="this.style.display=\'none\'">' +
            '<span class="advisor-web-domain">' + hostname + '</span>' +
            '<span class="advisor-web-badge">External Listing</span>' +
          "</div>" +
          '<div class="advisor-prop-title" style="font-size:0.9rem;margin-top:6px;">' + (r.title || "") + "</div>" +
          (r.description ? '<div class="advisor-prop-reason" style="color:var(--text-muted-light);font-size:0.8rem;margin-top:4px;">' + r.description + "</div>" : "") +
          '<a href="' + r.url + '" target="_blank" rel="noopener noreferrer" class="btn btn-outline-warning btn-sm w-100 fw-bold mt-2 py-2">' +
            '<i class="bi bi-box-arrow-up-right me-1"></i> View Original Listing' +
          "</a>" +
        "</div>" +
      "</div>"
    );
  }

  function addWebResults(results, heading) {
    var html = "";
    if (heading) {
      html += '<div class="advisor-results-heading" style="color:var(--color-yellow);">' + heading + "</div>";
    }
    html += '<div class="advisor-web-note">These listings are from external real estate websites. NestFinder is not affiliated with these listings.</div>';
    html += '<div class="advisor-prop-grid">';
    results.forEach(function (r) {
      html += webResultToCard(r);
    });
    html += "</div>";
    addMessage("bot", html);
  }

  function addPropertyResults(properties, explanations, heading) {
    var html = "";
    if (heading) {
      html += '<div class="advisor-results-heading">' + heading + "</div>";
    }
    html += '<div class="advisor-prop-grid">';
    properties.forEach(function (p, i) {
      var reason = explanations && explanations[i] ? explanations[i] : "";
      var score = p._matchScore || null;
      html += propertyToCard(p, reason, score);
    });
    html += "</div>";
    addMessage("bot", html);
  }

  function simpleQueryParser(userQuery) {
    var q = userQuery.toLowerCase().trim();
    var params = {
      query: userQuery,
      minPrice: 0, maxPrice: 0, city: "", area: "",
      type: "", bedrooms: 0, bathrooms: 0, category: "", goal: "",
      reply: ""
    };

    // City
    if (/karachi|khi/i.test(q)) params.city = "Karachi";
    else if (/lahore/i.test(q)) params.city = "Lahore";
    else if (/rawalpindi|rwp/i.test(q)) params.city = "Rawalpindi";
    else if (/islamabad/i.test(q)) params.city = "Islamabad";
    else if (/faisalabad/i.test(q)) params.city = "Faisalabad";
    else if (/multan/i.test(q)) params.city = "Multan";
    else if (/peshawar/i.test(q)) params.city = "Peshawar";
    else if (/quetta/i.test(q)) params.city = "Quetta";
    else if (/gujranwala/i.test(q)) params.city = "Gujranwala";
    else if (/hyderabad/i.test(q)) params.city = "Hyderabad";

    // Area
    var areas = ["dha", "gulshan", "gulberg", "clifton", "bahria", "f-?10", "f-?11", "f-?7", "f-?8", "e-?11", "saddar", "defence"];
    for (var i = 0; i < areas.length; i++) {
      var re = new RegExp(areas[i], "i");
      if (re.test(q)) { params.area = areas[i].replace(/[-\?]/g, "").toUpperCase(); break; }
    }

    // Type
    if (/(flat|apartment)/i.test(q)) params.type = "Apartment";
    else if (/villa/i.test(q)) params.type = "Villa";
    else if (/(plot|land)/i.test(q)) params.type = "Plot";
    else if (/commercial|shop|office/i.test(q)) params.type = "Commercial";
    else if (/(house|home|bungalow)/i.test(q)) params.type = "House";

    // Category
    if (/(rent|rental|lease)/i.test(q)) params.category = "For Rent";
    else if (/(buy|purchase|sale|for sale)/i.test(q)) params.category = "For Sale";

    // Bedrooms
    var bedMatch = q.match(/(\d+)\s*bed(?:room)?/);
    if (bedMatch) params.bedrooms = parseInt(bedMatch[1], 10);

    // Bathrooms
    var bathMatch = q.match(/(\d+)\s*bath(?:room)?/);
    if (bathMatch) params.bathrooms = parseInt(bathMatch[1], 10);

    // Budget
    var budgetPatterns = [
      [/under\s+(\d+\.?\d*)\s*(?:crore|cror)/i, function(m) { params.maxPrice = parseFloat(m[1]) * 10000000; }],
      [/under\s+(\d+\.?\d*)\s*(?:lakh|lac)/i, function(m) { params.maxPrice = parseFloat(m[1]) * 100000; }],
      [/(?:above|over|more than)\s+(\d+\.?\d*)\s*(?:crore|cror)/i, function(m) { params.minPrice = parseFloat(m[1]) * 10000000; }],
      [/(?:above|over|more than)\s+(\d+\.?\d*)\s*(?:lakh|lac)/i, function(m) { params.minPrice = parseFloat(m[1]) * 100000; }],
      [/(\d+\.?\d*)\s*(?:crore|cror)\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:crore|cror)/i, function(m) { params.minPrice = parseFloat(m[1]) * 10000000; params.maxPrice = parseFloat(m[2]) * 10000000; }],
      [/(\d+\.?\d*)\s*(?:lakh|lac)\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:lakh|lac)/i, function(m) { params.minPrice = parseFloat(m[1]) * 100000; params.maxPrice = parseFloat(m[2]) * 100000; }],
      [/(\d+\.?\d*)\s*(?:crore|cror)(?!\s*(?:to|-))/i, function(m) { var v = parseFloat(m[1]) * 10000000; params.minPrice = Math.round(v * 0.8); params.maxPrice = Math.round(v * 1.2); }],
      [/(\d+\.?\d*)\s*(?:lakh|lac)(?!\s*(?:to|-))/i, function(m) { var v = parseFloat(m[1]) * 100000; params.minPrice = Math.round(v * 0.8); params.maxPrice = Math.round(v * 1.2); }]
    ];
    for (var j = 0; j < budgetPatterns.length; j++) {
      var match = q.match(budgetPatterns[j][0]);
      if (match) { budgetPatterns[j][1](match); break; }
    }

    // Goal
    if (/invest|profit|roi|appreciation/i.test(q)) params.goal = "investment";
    else if (/family|kids|school/i.test(q)) params.goal = "family";
    else if (/student|university|college/i.test(q)) params.goal = "student";
    else if (/premium|luxury|elite/i.test(q)) params.goal = "premium";

    // Reply
    var parts = [];
    if (params.city) parts.push("in " + params.city);
    if (params.area) parts.push(params.area);
    if (params.type) parts.push(params.type);
    if (params.bedrooms > 0) parts.push(params.bedrooms + " bedroom");
    if (params.category) parts.push(params.category.replace("For ", "").toLowerCase());
    if (params.minPrice > 0 || params.maxPrice > 0) parts.push("within budget");
    params.reply = parts.length > 0
      ? "Searching " + parts.join(", ") + "."
      : "Let me search our listings.";

    return params;
  }

  function extractParams(userQuery) {
    var systemPrompt =
      "You are NestFinder AI's search query parser. Extract structured search parameters from the user's natural language query about Pakistani real estate. " +
      "Return ONLY a valid JSON object. Never add explanations.\n\n" +
      "Rules:\n" +
      "- Convert crore to 10000000, lakh to 100000\n" +
      '- If user says "under X", set maxPrice to X, minPrice to 0\n' +
      '- If user says "above X" or "over X", set minPrice to X, maxPrice to 0\n' +
      '- If user says "between X and Y" or "X to Y", set minPrice to X, maxPrice to Y\n' +
      '- If user says a single number like "50 lakh", set minPrice to 5000000, maxPrice to 6000000 (range of 20% around the value)\n' +
      "- City should be one of: Karachi, Lahore, Islamabad, or empty string if not specified\n" +
      "- Area is the specific neighborhood/sector/phase (e.g. DHA, Gulshan, F-10)\n" +
      "- Property type should be one of: House, Apartment, Villa, Plot, Commercial, Penthouse, Office, Shop, or empty string\n" +
      "- Category should be: For Sale, For Rent, or empty string\n" +
      '- User goal hints: "family", "investment", "rental", "premium", "student"\n' +
      '- If user says "best area for investment" or similar, set goal to "investment" and leave other fields empty\n\n' +
      'Output JSON schema:\n' +
      '{\n' +
      '  "query": "original query",\n' +
      '  "minPrice": number or 0,\n' +
      '  "maxPrice": number or 0,\n' +
      '  "city": "",\n' +
      '  "area": "",\n' +
      '  "type": "",\n' +
      '  "bedrooms": number or 0,\n' +
      '  "bathrooms": number or 0,\n' +
      '  "category": "",\n' +
      '  "goal": "",\n' +
      '  "reply": "a friendly one-sentence confirmation of what was understood"\n' +
      "}";

    return AIEngine.callGroq(userQuery, systemPrompt, 0.2).then(function (response) {
      // If Groq fails, use simple parser
      if (!response) {
        return simpleQueryParser(userQuery);
      }
      try {
        var cleaned = response.replace(/```json|```/g, "").trim();
        var parsed = JSON.parse(cleaned);
        return parsed;
      } catch (e) {
        return simpleQueryParser(userQuery);
      }
    });
  }

  function normalizeCity(city) {
    var map = {
      "karachi": "Karachi", "khi": "Karachi",
      "lahore": "Lahore",
      "rawalpindi": "Rawalpindi", "rwp": "Rawalpindi",
      "islamabad": "Islamabad",
      "faisalabad": "Faisalabad",
      "multan": "Multan",
      "peshawar": "Peshawar",
      "quetta": "Quetta",
      "gujranwala": "Gujranwala",
      "hyderabad": "Hyderabad", "hbd": "Hyderabad"
    };
    return map[(city || "").toLowerCase().trim()] || "";
  }

  function propertyMatchesCity(property, city) {
    if (!city) return true;
    var loc = (property.location || "").toLowerCase();
    var nc = city.toLowerCase();
    return loc.indexOf(nc) !== -1;
  }

  function matchProperties(params) {
    if (!allProperties.length) return [];
    var results = [];

    allProperties.forEach(function (p) {
      var score = 0;
      var totalWeight = 0;
      var matches = [];

      if (p.status === "Disabled" || p.status === "Sold" || p.status === "Rented") return;

      // City match (weight: 25) — HARD REQUIREMENT: if city specified, property MUST be in that city
      if (params.city) {
        if (!propertyMatchesCity(p, params.city)) return;
        score += 25;
        matches.push("city");
      }
      totalWeight += 25;

      // Area match (weight: 20)
      if (params.area) {
        totalWeight += 20;
        if ((p.location || "").toLowerCase().indexOf(params.area.toLowerCase()) !== -1) {
          score += 20;
          matches.push("area");
        }
      }

      // Property type match (weight: 15)
      if (params.type) {
        totalWeight += 15;
        if ((p.type || "").toLowerCase() === params.type.toLowerCase()) {
          score += 15;
          matches.push("type");
        }
      }

      // Category match (weight: 10)
      if (params.category) {
        totalWeight += 10;
        if ((p.category || "").toLowerCase() === params.category.toLowerCase()) {
          score += 10;
          matches.push("category");
        }
      }

      // Bedrooms match (weight: 10)
      if (params.bedrooms > 0) {
        totalWeight += 10;
        if (p.bedrooms === params.bedrooms) {
          score += 10;
          matches.push("bedrooms");
        } else if (p.bedrooms >= params.bedrooms - 1 && p.bedrooms <= params.bedrooms + 1) {
          score += 5;
          matches.push("bedrooms_near");
        }
      }

      // Bathrooms match (weight: 5)
      if (params.bathrooms > 0) {
        totalWeight += 5;
        if (p.bathrooms === params.bathrooms) {
          score += 5;
          matches.push("bathrooms");
        } else if (p.bathrooms >= params.bathrooms - 1 && p.bathrooms <= params.bathrooms + 1) {
          score += 2;
          matches.push("bathrooms_near");
        }
      }

      // Price match (weight: 15)
      if (params.maxPrice > 0 || params.minPrice > 0) {
        totalWeight += 15;
        if (params.maxPrice > 0 && params.minPrice > 0) {
          if (p.price >= params.minPrice && p.price <= params.maxPrice) {
            score += 15;
            matches.push("price");
          } else if (p.price >= params.minPrice * 0.9 && p.price <= params.maxPrice * 1.1) {
            score += 8;
            matches.push("price_near");
          }
        } else if (params.maxPrice > 0) {
          if (p.price <= params.maxPrice) {
            score += 15;
            matches.push("price");
          } else if (p.price <= params.maxPrice * 1.1) {
            score += 8;
            matches.push("price_near");
          }
        } else if (params.minPrice > 0) {
          if (p.price >= params.minPrice) {
            score += 15;
            matches.push("price");
          } else if (p.price >= params.minPrice * 0.9) {
            score += 8;
            matches.push("price_near");
          }
        }
      }

      if (totalWeight === 0) totalWeight = 1;
      var pct = Math.round((score / totalWeight) * 100);
      if (pct >= 50) {
        p._matchScore = pct;
        p._matches = matches;
        results.push(p);
      }
    });

    results.sort(function (a, b) { return b._matchScore - a._matchScore; });
    return results.slice(0, 8);
  }

  function expandParams(params) {
    var expanded = [];
    var base = JSON.parse(JSON.stringify(params));

    // Expand price upward by 10%
    if (params.maxPrice > 0) {
      var up = JSON.parse(JSON.stringify(base));
      up.maxPrice = Math.round(params.maxPrice * (1 + CONFIG.PRICE_EXPAND_PCT));
      up._label = "Increased budget up to " + formatPrice(up.maxPrice, params.category);
      expanded.push(up);
    }

    // Expand price downward by 10% (if minPrice exists)
    if (params.minPrice > 0) {
      var down = JSON.parse(JSON.stringify(base));
      down.minPrice = Math.max(0, Math.round(params.minPrice * (1 - CONFIG.PRICE_EXPAND_PCT)));
      down._label = "Reduced minimum price";
      expanded.push(down);
    }

    // Relax bedroom constraint by 1
    if (params.bedrooms > 1) {
      var bed = JSON.parse(JSON.stringify(base));
      bed.bedrooms = params.bedrooms - 1;
      bed._label = params.bedrooms + " bed not available, trying " + (params.bedrooms - 1) + " bed";
      expanded.push(bed);
    }
    if (params.bedrooms > 0) {
      var bedUp = JSON.parse(JSON.stringify(base));
      bedUp.bedrooms = params.bedrooms + 1;
      bedUp._label = params.bedrooms + " bed not available, trying " + (params.bedrooms + 1) + " bed";
      expanded.push(bedUp);
    }

    // Relax bathroom constraint by 1
    if (params.bathrooms > 1) {
      var bath = JSON.parse(JSON.stringify(base));
      bath.bathrooms = params.bathrooms - 1;
      bath._label = params.bathrooms + " bath not available, trying " + (params.bathrooms - 1) + " bath";
      expanded.push(bath);
    }
    if (params.bathrooms > 0) {
      var bathUp = JSON.parse(JSON.stringify(base));
      bathUp.bathrooms = params.bathrooms + 1;
      bathUp._label = params.bathrooms + " bath not available, trying " + (params.bathrooms + 1) + " bath";
      expanded.push(bathUp);
    }

    // Similar types (same city only — never change city)
    if (params.type && CONFIG.SIMILAR_TYPES_FALLBACK) {
      var typeMap = {
        "House": ["Villa", "Apartment"],
        "Apartment": ["House", "Penthouse"],
        "Villa": ["House"],
        "Plot": ["Commercial"],
        "Commercial": ["Office", "Shop"],
        "Penthouse": ["Apartment"],
        "Office": ["Commercial"],
        "Shop": ["Commercial"]
      };
      var similar = typeMap[params.type] || [];
      similar.forEach(function (t) {
        var s = JSON.parse(JSON.stringify(base));
        s.type = t;
        s._label = "Similar type: " + t + " in " + (params.city || "same area");
        expanded.push(s);
      });
    }

    return expanded;
  }

  function generateExplanation(property, params) {
    var prompt =
      "You are NestFinder AI's property advisor. A user searched for properties with these criteria:\n" +
      JSON.stringify(params, null, 2) + "\n\n" +
      "This property was found as a match:\n" +
      "Title: " + (property.title || "N/A") + "\n" +
      "Price: PKR " + (property.price || 0) + "\n" +
      "Location: " + (property.location || "N/A") + "\n" +
      "Type: " + (property.type || "N/A") + "\n" +
      "Bedrooms: " + (property.bedrooms || 0) + "\n" +
      "Bathrooms: " + (property.bathrooms || 0) + "\n" +
      "Area: " + (property.area || "N/A") + "\n" +
      "Category: " + (property.category || "N/A") + "\n\n" +
      "Write ONE short sentence (max 15 words) explaining why this property matches the user's needs. Be specific and helpful. " +
      "Focus only on the criteria that actually match. Never invent details. Never mention price unless the user asked about budget.";

    return AIEngine.callGroq(prompt, "You are a concise real estate advisor. Respond with ONLY one short sentence, no more than 15 words.", 0.3).then(function (response) {
      return response || "This property matches your search criteria.";
    });
  }

  function generateExplanations(properties, params) {
    if (!properties.length) return Promise.resolve([]);
    return Promise.all(
      properties.map(function (p) {
        return generateExplanation(p, params);
      })
    );
  }

  function generateSummaryResponse(matches, params) {
    if (!matches.length) return "";

    var count = matches.length;
    var best = matches[0];
    var prompt =
      "You are NestFinder AI. Write ONE short sentence (max 20 words) announcing search results. " +
      "Properties found: " + count + ". Top match: " + (best.title || "property") + " in " + (best.location || "Pakistan") +
      ". User searched for: " + JSON.stringify(params);

    return AIEngine.callGroq(prompt, "You are a concise real estate assistant. One sentence only, max 20 words.", 0.3).then(function (r) {
      return r || ("I found " + count + " matching " + (count === 1 ? "property" : "properties") + " for you.");
    });
  }

  function generateNoResultsResponse(params, alternatives) {
    var criteria = [];
    if (params.type) criteria.push(params.type);
    if (params.bedrooms > 0) criteria.push(params.bedrooms + "-bedroom");
    if (params.city) criteria.push("in " + params.city);
    if (params.area) criteria.push(params.area);
    var criteriaStr = criteria.length > 0 ? criteria.join(" ") : "your criteria";
    var altDesc = alternatives.length > 0 ? " Showing " + alternatives.length + " close alternative" + (alternatives.length > 1 ? "s" : "") + " from " + (params.city || "same location") + " with adjusted criteria." : "";
    return Promise.resolve("No exact match found for " + criteriaStr + "." + altDesc);
  }

  function generateAreaAdvice(params) {
    var prompt =
      "You are NestFinder AI's area investment advisor. The user is looking for advice about real estate in Pakistan. " +
      "Their query: \"" + (params.query || "") + "\". " +
      "Goal: " + (params.goal || "general") + ".\n\n" +
      "Based on our current property database, provide a brief, helpful response (2-3 sentences) about good areas for their needs. " +
      "Be honest about what we know. If the user asks 'which area is best for investment', give general advice about " +
      "Karachi (DHA, Clifton, Gulshan), Lahore (DHA, Gulberg, Bahria Town), and Islamabad (F sectors, E sectors, Bahria Town). " +
      "Never invent specific data. Suggest they browse our listings for current prices and availability.";

    return AIEngine.callGroq(prompt, "You are a knowledgeable Pakistani real estate advisor. Concise, specific, helpful.", 0.4).then(function (r) {
      return r || "I'd recommend checking out DHA and Gulberg in Lahore, Clifton and DHA in Karachi, or the F-sectors in Islamabad for strong investment potential. Browse our listings to see current options.";
    });
  }

  function saveSearchToFirebase(params) {
    return new Promise(function (resolve, reject) {
      var user = null;
      try { user = window.NestFinderAuth && NestFinderAuth.getCurrentUser(); } catch (e) {}

      var searchData = {
        params: params,
        createdAt: new Date().toISOString(),
        userId: user ? user.id : "anonymous",
        userEmail: user ? user.email : null
      };

      try {
        var ref = firebase.database().ref("savedSearches").push();
        ref.set(searchData, function (err) {
          if (err) reject(err);
          else resolve(ref.key);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  function processQuery(userQuery) {
    if (!userQuery || !userQuery.trim() || isSearching) return;

    addMessage("user", '<div class="advisor-user-text">' + escapeHtml(userQuery) + "</div>");
    DOM.input.value = "";
    setLoading(true);
    addTypingIndicator();

    var isAreaQuestion = /best area for investment|which area|where should i (invest|buy|rent)|good area|recommend (an )?area/i.test(userQuery);

    function handleParams(params) {
      if (params.reply) {
        addMessage("bot", '<div class="advisor-ai-text">' + params.reply + "</div>");
      }

      if (isAreaQuestion && !params.city && !params.type && !params.bedrooms) {
        removeTypingIndicator();
        generateAreaAdvice(params).then(function (advice) {
          addMessage("bot", '<div class="advisor-ai-text">' + advice + "</div>");
          addQuickActions([
            { label: "Search Properties in Karachi", icon: "building", action: function () { DOM.input.value = "Show me properties in Karachi"; processQuery(DOM.input.value); } },
            { label: "Search Properties in Lahore", icon: "building", action: function () { DOM.input.value = "Show me properties in Lahore"; processQuery(DOM.input.value); } },
            { label: "Search Properties in Islamabad", icon: "building", action: function () { DOM.input.value = "Show me properties in Islamabad"; processQuery(DOM.input.value); } }
          ]);
          setLoading(false);
        });
        return;
      }

      lastParams = params;
      var exactMatches = matchProperties(params);

      // Always fire web search in background (auto Zenserp fallback)
      var webSearchPromise = searchWeb(params);

      if (exactMatches.length > 0) {
        var topMatches = exactMatches.slice(0, 6);
        removeTypingIndicator();
        setLoading(true);
        addTypingIndicator();

        Promise.all([
          generateExplanations(topMatches, params),
          generateSummaryResponse(topMatches, params)
        ]).then(function (results) {
          removeTypingIndicator();
          addPropertyResults(topMatches, results[0], results[1]);
          setLoading(false);
        });
      } else {
        // Try expanded search
        removeTypingIndicator();
        setLoading(true);
        addTypingIndicator();

        var expandedParams = expandParams(params);
        var allAlternatives = [];
        var usedKeys = {};

        expandedParams.forEach(function (ep) {
          var results = matchProperties(ep);
          results.forEach(function (p) {
            var key = p.firebaseKey || p.id;
            if (!usedKeys[key]) {
              usedKeys[key] = true;
              p._fallbackLabel = ep._label || "";
              allAlternatives.push(p);
            }
          });
        });

        if (allAlternatives.length > 0) {
          var topAlts = allAlternatives.slice(0, 6);
          removeTypingIndicator();
          setLoading(true);
          addTypingIndicator();

          Promise.all([
            generateExplanations(topAlts, params),
            generateNoResultsResponse(params, topAlts)
          ]).then(function (results) {
            removeTypingIndicator();
            addPropertyResults(topAlts, results[0] || [], results[1] || "No exact match found. Showing closest alternatives:");
            setLoading(false);
          });
        } else {
          // No Firebase matches at all — show web results directly
          removeTypingIndicator();
          webSearchPromise.then(function (webResults) {
            if (webResults.length > 0) {
              addWebResults(webResults, "No matches in our database. Here are live listings from external real estate websites:");
              addQuickActions([
                { label: "Refine My Search", icon: "search", action: function () { DOM.input.focus(); } },
                { label: "Save My Search", icon: "bookmark-star", action: handleSaveSearch }
              ]);
            } else {
              addMessage("bot", '<div class="advisor-ai-text">No matches found in our database or on external websites. Try different search terms.</div>');
              addQuickActions([
                { label: "Browse All Listings", icon: "list-ul", action: function () { DOM.input.value = "Show me all available properties"; processQuery(DOM.input.value); } },
                { label: "Try Different City", icon: "geo-alt", action: function () { DOM.input.value = "Show me properties in Karachi"; processQuery(DOM.input.value); } }
              ]);
            }
            setLoading(false);
          });
        }
      }

      // After showing Firebase results (exact or expanded), append web results if available
      if (exactMatches.length > 0 || allAlternatives.length > 0) {
        webSearchPromise.then(function (webResults) {
          if (webResults.length > 0) {
            addWebResults(webResults, "Also found on external sites (Zameen, Graana, etc.):");
          }
        });
      }
    }

    extractParams(userQuery).then(handleParams).catch(function (err) {
      removeTypingIndicator();
      showError("Something went wrong. Please try rephrasing your question.");
      setLoading(false);
    });
  }

  function handleSaveSearch() {
    if (!lastParams) return;

    addTypingIndicator();
    saveSearchToFirebase(lastParams).then(function (key) {
      removeTypingIndicator();
      addMessage("bot",
        '<div class="advisor-ai-text">' +
          '<i class="bi bi-check-circle-fill me-1" style="color:#22c55e"></i> Your search has been saved! ' +
          'We\'ll notify you when matching properties become available.' +
        "</div>"
      );
    }).catch(function () {
      removeTypingIndicator();
      showError("Could not save your search. Please try again.");
    });
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function loadAllProperties() {
    if (window.NestFinderAPI) {
      NestFinderAPI.fetchAll().then(function (props) {
        allProperties = props.filter(function (p) { return p.status !== "Disabled"; });
      }).catch(function () {
        allProperties = [];
      });
    }
  }

  function initAdvisor() {
    cacheDOM();
    if (!DOM.chat || !DOM.input || !DOM.sendBtn) return;

    // Welcome message
    addMessage("bot",
      '<div class="advisor-ai-text">' +
        '<i class="bi bi-robot me-2" style="color:#f59e0b;font-size:1.2rem;"></i>' +
        'Hi! I\'m your NestFinder AI property advisor. Tell me what you\'re looking for, and I\'ll find the best matches from our listings.' +
      "</div>"
    );

    addQuickActions([
      {
        label: "3-Bed House in DHA",
        icon: "house-heart",
        action: function () { DOM.input.value = "I need a 3-bedroom house in DHA under PKR 1.5 crore"; processQuery(DOM.input.value); }
      },
      {
        label: "Apartments in Karachi",
        icon: "building",
        action: function () { DOM.input.value = "Show me apartments in Karachi"; processQuery(DOM.input.value); }
      },
      {
        label: "Best Area for Investment",
        icon: "graph-up-arrow",
        action: function () { DOM.input.value = "Which area is best for investment?"; processQuery(DOM.input.value); }
      }
    ]);

    // Event listeners
    DOM.sendBtn.addEventListener("click", function () {
      processQuery(DOM.input.value);
    });

    DOM.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        processQuery(DOM.input.value);
      }
    });

    // Load properties
    loadAllProperties();
  }

  // Expose public API
  window.PropertyAdvisor = {
    init: initAdvisor,
    ask: processQuery,
    saveSearch: handleSaveSearch
  };

  // Auto-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdvisor);
  } else {
    initAdvisor();
  }
})();
