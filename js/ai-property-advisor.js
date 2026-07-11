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

  function searchWeb(params) {
    return fetch(ZENSERP_FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: params.query || "",
        params: params
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Search service error: " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.results)) return [];
        return data.results.map(function (r) {
          r._webResult = true;
          return r;
        });
      })
      .catch(function (err) {
        console.error("Web search error:", err);
        return [];
      });
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
      if (!response) {
        return {
          query: userQuery,
          minPrice: 0, maxPrice: 0, city: "", area: "",
          type: "", bedrooms: 0, bathrooms: 0, category: "", goal: "",
          reply: "I understood your request. Let me search our listings."
        };
      }
      try {
        var cleaned = response.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return {
          query: userQuery,
          minPrice: 0, maxPrice: 0, city: "", area: "",
          type: "", bedrooms: 0, bathrooms: 0, category: "", goal: "",
          reply: "I understood your request. Let me search our listings."
        };
      }
    });
  }

  function matchProperties(params) {
    if (!allProperties.length) return [];
    var results = [];

    allProperties.forEach(function (p) {
      var score = 0;
      var totalWeight = 0;
      var matches = [];

      if (p.status === "Disabled" || p.status === "Sold" || p.status === "Rented") return;

      // City match (weight: 25)
      if (params.city) {
        totalWeight += 25;
        var city = getPropertyCity(p.location).toLowerCase();
        var loc = (p.location || "").toLowerCase();
        if (city.indexOf(params.city.toLowerCase()) !== -1 || loc.indexOf(params.city.toLowerCase()) !== -1) {
          score += 25;
          matches.push("city");
        }
      }

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
      if (pct >= 30) {
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

    // Similar types
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
        s._label = "Similar type: " + t;
        expanded.push(s);
      });
    }

    // Remove city filter to search nationwide
    if (params.city) {
      var noCity = JSON.parse(JSON.stringify(base));
      noCity.city = "";
      noCity.area = "";
      noCity._label = "Searching all cities";
      expanded.push(noCity);
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
    var prompt =
      "You are NestFinder AI. A user searched for properties with these criteria but no exact matches were found:\n" +
      JSON.stringify(params, null, 2) + "\n\n" +
      "We found " + alternatives.length + " alternative suggestions by relaxing some criteria. " +
      "Write ONE helpful sentence (max 25 words) explaining that we found alternatives with adjusted criteria, " +
      "and encourage the user to check them out or try a different search.";

    return AIEngine.callGroq(prompt, "You are a helpful real estate assistant. One sentence, max 25 words. Never apologize excessively.", 0.3).then(function (r) {
      return r || ("I couldn't find an exact match, but here are " + alternatives.length + " close alternatives you might like.");
    });
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
          addQuickActions([
            { label: "Refine My Search", icon: "search", action: function () { DOM.input.focus(); } },
            { label: "Save My Search", icon: "bookmark-star", action: handleSaveSearch }
          ]);
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
            addPropertyResults(topAlts, results[1] ? [] : results[0], results[1] || "Here are some alternative suggestions:");
            var nearbyQ = lastParams && lastParams.city ? "Show me properties near " + lastParams.city : "Show me all available properties";
            addQuickActions([
              { label: "Search Nearby Areas", icon: "geo-alt", action: function () { DOM.input.value = nearbyQ; processQuery(DOM.input.value); } },
              { label: "Increase Budget by 10%", icon: "graph-up-arrow", action: function () { if (lastParams) { var newMax = Math.round((lastParams.maxPrice || 50000000) * 1.1); DOM.input.value = "Show me properties under PKR " + newMax; processQuery(DOM.input.value); } } },
              { label: "Save My Search", icon: "bookmark-star", action: handleSaveSearch }
            ]);
            setLoading(false);
          });
        } else {
          // No Firebase matches — try Zenserp web search
          removeTypingIndicator();
          setLoading(true);
          addTypingIndicator();

          searchWeb(params).then(function (webResults) {
            removeTypingIndicator();

            if (webResults.length > 0) {
              var heading = "I found these listings on external real estate websites that match your search:";
              addWebResults(webResults, heading);
              addQuickActions([
                { label: "Refine My Search", icon: "search", action: function () { DOM.input.focus(); } },
                { label: "Save My Search", icon: "bookmark-star", action: handleSaveSearch }
              ]);
            } else {
              var noResultsMsg =
                "We couldn't find any matching properties on our platform or trusted external websites. Please try different search criteria.";
              addMessage("bot", '<div class="advisor-ai-text">' + noResultsMsg + "</div>");
              addQuickActions([
                { label: "Browse All Listings", icon: "list-ul", action: function () { DOM.input.value = "Show me all available properties"; processQuery(DOM.input.value); } },
                { label: "Try Different City", icon: "geo-alt", action: function () { DOM.input.value = "Show me properties in Karachi"; processQuery(DOM.input.value); } },
                { label: "Save My Search", icon: "bookmark-star", action: handleSaveSearch }
              ]);
            }
            setLoading(false);
          }).catch(function () {
            removeTypingIndicator();
            var fallbackMsg =
              "We couldn't find any matching properties on our platform or trusted external websites. Please try different search criteria.";
            addMessage("bot", '<div class="advisor-ai-text">' + fallbackMsg + "</div>");
            addQuickActions([
              { label: "Browse All Listings", icon: "list-ul", action: function () { DOM.input.value = "Show me all available properties"; processQuery(DOM.input.value); } },
              { label: "Save My Search", icon: "bookmark-star", action: handleSaveSearch }
            ]);
            setLoading(false);
          });
        }
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
