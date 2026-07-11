const http = require("http");
const https = require("https");
const PORT = 3001;

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function buildSearchQuery(params) {
  var parts = [];
  if (params.type && params.type !== "all" && params.type !== "") parts.push(params.type);
  if (params.bedrooms > 0) parts.push(params.bedrooms + "-bedroom");
  if (params.area) parts.push(params.area);
  if (params.city) parts.push(params.city);
  if (params.maxPrice > 0) parts.push("under-Rs-" + params.maxPrice);
  if (params.minPrice > 0) parts.push("above-Rs-" + params.minPrice);
  if (params.bathrooms > 0) parts.push(params.bathrooms + "-bath");
  if (parts.length === 0) parts.push("property-for-sale");
  return parts.join(" ");
}

function buildZameenUrl(params) {
  var city = (params.city || "Karachi").toLowerCase();
  var typeMap = {
    house: "Homes", flat: "Apartments", apartment: "Apartments",
    villa: "Homes", plot: "Plots", commercial: "Commercial"
  };
  var type = typeMap[params.type] || "Homes";
  var purpose = "Sale";
  var bedrooms = "";
  if (params.bedrooms > 0) {
    if (params.bedrooms <= 3) bedrooms = "?bedrooms=l-" + params.bedrooms;
    else bedrooms = "?bedrooms=" + params.bedrooms + "-l";
  }
  var price = "";
  if (params.minPrice > 0 || params.maxPrice > 0) {
    var sep = bedrooms ? "&" : "?";
    if (params.minPrice > 0) price = sep + "price_l=" + params.minPrice;
    if (params.maxPrice > 0) price += (params.minPrice > 0 ? "&" : sep) + "price_u=" + params.maxPrice;
  }
  return "https://www.zameen.com/" + type + "/" + city + "-2-1.html" + bedrooms + price;
}

function buildGraanaUrl(params) {
  var city = (params.city || "Karachi").toLowerCase();
  var purpose = "property-for-sale";
  var typeMap = {
    house: "houses", flat: "apartments", apartment: "apartments",
    villa: "houses", plot: "plots"
  };
  var type = typeMap[params.type] || "";
  var path = type ? city + "/" + type + "/" + purpose : city + "/" + purpose;
  var query = "";
  if (params.bedrooms > 0) query = "?bedrooms=" + params.bedrooms;
  if (params.minPrice > 0) query += (query ? "&" : "?") + "minPrice=" + params.minPrice;
  if (params.maxPrice > 0) query += (query ? "&" : "?") + "maxPrice=" + params.maxPrice;
  return "https://www.graana.com/search/" + path + query;
}

function buildOlxUrl(params) {
  var city = (params.city || "Karachi").toLowerCase();
  var queryParts = [];
  if (params.type && params.type !== "all") queryParts.push(params.type);
  if (params.bedrooms > 0) queryParts.push(params.bedrooms + "-bedroom");
  if (params.area) queryParts.push(params.area);
  var q = queryParts.length > 0 ? queryParts.join("-") : "property";
  return "https://www.olx.com.pk/properties/q-" + q + "/?city=" + city;
}

function buildPropertyResults(params, userQuery) {
  var city = (params.city || "Karachi").toLowerCase();
  var bedroomText = params.bedrooms > 0 ? params.bedrooms + " Bedroom " : "";
  var typeLabel = params.type && params.type !== "all" ? params.type + "s" : "Properties";
  var priceLabel = "";
  if (params.minPrice > 0 && params.maxPrice > 0) priceLabel = " (Rs." + params.minPrice + " - Rs." + params.maxPrice + ")";
  else if (params.minPrice > 0) priceLabel = " (Above Rs." + params.minPrice + ")";
  else if (params.maxPrice > 0) priceLabel = " (Under Rs." + params.maxPrice + ")";

  var results = [];

  results.push({
    title: bedroomText + typeLabel + " for Sale in " + city.charAt(0).toUpperCase() + city.slice(1) + " - Zameen.com",
    url: buildZameenUrl(params),
    source: "zameen.com",
    description: "Browse " + (bedroomText || "").toLowerCase() + typeLabel.toLowerCase() + " for sale in " + city + priceLabel + ". View photos, prices, and details on Zameen.com - Pakistan's #1 real estate portal.",
    _webResult: true
  });

  results.push({
    title: bedroomText + typeLabel + " in " + city.charAt(0).toUpperCase() + city.slice(1) + " - Graana.com",
    url: buildGraanaUrl(params),
    source: "graana.com",
    description: "Find " + (bedroomText || "").toLowerCase() + typeLabel.toLowerCase() + " for sale in " + city + priceLabel + ". Search property listings on Graana.com.",
    _webResult: true
  });

  results.push({
    title: bedroomText + typeLabel + " for Sale in " + city.charAt(0).toUpperCase() + city.slice(1) + " - OLX Pakistan",
    url: buildOlxUrl(params),
    source: "olx.com.pk",
    description: "Find " + (bedroomText || "").toLowerCase() + typeLabel.toLowerCase() + " for sale in " + city + priceLabel + " on OLX Pakistan. Post your classified ad for free.",
    _webResult: true
  });

  if (params.area) {
    var areaCity = params.area + " " + city;
    results.push({
      title: bedroomText + typeLabel + " in " + params.area + ", " + city.charAt(0).toUpperCase() + city.slice(1) + " - Zameen.com",
      url: "https://www.zameen.com/" + (params.type && params.type !== "all" ? params.type + "s" : "property") + "/" + city + "-" + encodeURIComponent(params.area.toLowerCase()) + "-2-1.html",
      source: "zameen.com",
      description: "Properties for sale in " + params.area + ", " + city + priceLabel + ". Find your dream home in " + params.area + ".",
      _webResult: true
    });
  }

  if (userQuery) {
    results.push({
      title: 'Search Results for "' + userQuery + '"',
      url: "https://www.zameen.com/Homes/" + city + "-2-1.html?q=" + encodeURIComponent(userQuery),
      source: "zameen.com",
      description: "Search results for '" + userQuery + "' on Zameen.com. Find matching properties for sale.",
      _webResult: true
    });
  }

  return results;
}

function tryBingRss(searchQuery) {
  return new Promise(function(resolve) {
    var q = encodeURIComponent(searchQuery);
    var bingUrl = "https://www.bing.com/search?q=" + q + "&format=rss&count=10";
    https.get(bingUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        if (res.statusCode !== 200) { resolve(null); return; }
        try {
          var items = [];
          var itemRe = /<item>[\s\S]*?<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>[\s\S]*?<link>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/link>[\s\S]*?<description>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/description>/gi;
          var m;
          while ((m = itemRe.exec(data)) !== null) {
            var title = (m[1] || m[2] || "").replace(/<[^>]+>/g, "").trim();
            var link = (m[3] || m[4] || "").trim();
            var desc = (m[5] || m[6] || "").replace(/<[^>]+>/g, "").trim();
            if (!title) continue;
            var hn = "";
            try { hn = new URL(link).hostname.replace("www.", ""); } catch (e) {}
            var skipWords = /calculator|wikipedia|w3schools|wikihow|mathway|what3words|quickmath|three\.com|varzesh3/i;
            if (skipWords.test(hn) || skipWords.test(title)) continue;
            items.push({ title: title, url: link, source: hn, description: desc.substring(0, 300), _webResult: true });
          }
          resolve(items.slice(0, 6));
        } catch (e) { resolve(null); }
      });
    }).on("error", function() { resolve(null); });
  });
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendJSON(res, 204, "");
    return;
  }

  if (req.url.startsWith("/api/zenserp") && req.method === "POST") {
    var body = "";
    req.on("data", function(chunk) { body += chunk; });
    req.on("end", async function() {
      var parsed;
      try { parsed = JSON.parse(body); } catch (e) {
        sendJSON(res, 400, { error: "Invalid JSON", results: [] });
        return;
      }

      var params = parsed.params || {};
      var userQuery = (parsed.query || "").trim();
      var searchQuery = userQuery;
      if (!searchQuery) {
        var parts = [];
        if (params.type && params.type !== "all") parts.push(params.type);
        if (params.bedrooms > 0) parts.push(params.bedrooms + " bedroom");
        if (params.area) parts.push(params.area);
        if (params.city) parts.push(params.city);
        parts.push("for sale");
        searchQuery = parts.join(" ") || "property for sale";
      }

      console.log("Proxy search:", searchQuery);

      // Try Cloudflare Worker (primary search source)
      try {
        var workerResult = await new Promise(function(resolve, reject) {
          var workerUrl = "https://nestfinder-search.nestfinder.workers.dev/api/search";
          var postData = JSON.stringify({ query: searchQuery, params: params });
          var parsed = new URL(workerUrl);
          var opts = {
            hostname: parsed.hostname,
            path: parsed.pathname,
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) }
          };
          var req = https.request(opts, function(resp) {
            var data = "";
            resp.on("data", function(c) { data += c; });
            resp.on("end", function() {
              try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
          });
          req.on("error", reject);
          req.setTimeout(15000, function() { req.destroy(); reject(new Error("Timeout")); });
          req.write(postData);
          req.end();
        });

        if (workerResult && workerResult.results && workerResult.results.length > 0) {
          console.log("Proxy <- " + workerResult.results.length + " results (worker)");
          sendJSON(res, 200, { results: workerResult.results.slice(0, 10) });
          return;
        }
      } catch (e) {
        console.log("Worker failed:", e.message);
      }

      // Fallback: curated property links
      console.log("Proxy <- property links (fallback)");
      var fallbackResults = buildPropertyResults(params, userQuery);
      sendJSON(res, 200, { results: fallbackResults.slice(0, 8), _fallback: true });
    });
    return;
  }

  sendJSON(res, 404, { error: "Not found" });
}

var server = http.createServer(handleRequest);
server.listen(PORT, function() {
  console.log("Proxy running on http://localhost:" + PORT + "/api/zenserp");
  console.log("POST /api/zenserp with { params, query }");
});
