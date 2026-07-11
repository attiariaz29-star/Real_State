const http = require("http");
const url = require("url");

const ZENSERP_KEY = "122f3100-7d16-11f1-bd2a-5709df9cc523";
const ZENSERP_ENDPOINT = "https://app.zenserp.com/api/v2/search";
const PORT = 3001;
const SEARCH_SITES = ["zameen.com", "graana.com", "agency21.com", "lamudi.pk"];

function buildWebQuery(params) {
  var parts = [];
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

function formatPrice(n) {
  if (!n) return "";
  if (n >= 10000000) return (n / 10000000).toFixed(1) + " Crore";
  if (n >= 100000) return (n / 100000).toFixed(1) + " Lakh";
  return n.toLocaleString();
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendJSON(res, 204, "");
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/zenserp") {
    sendJSON(res, 404, { error: "Not found" });
    return;
  }

  var body = "";
  req.on("data", function (chunk) { body += chunk; });
  req.on("end", async function () {
    var parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      sendJSON(res, 400, { error: "Invalid JSON", results: [] });
      return;
    }

    var params = parsed.params || {};
    var searchQuery = buildWebQuery(params);
    console.log("Proxy -> Zenserp query:", searchQuery);

    try {
      var zenserpUrl = ZENSERP_ENDPOINT +
        "?q=" + encodeURIComponent(searchQuery) +
        "&apikey=" + ZENSERP_KEY +
        "&num=6";

      var response = await fetch(zenserpUrl);
      if (!response.ok) {
        console.error("Zenserp error:", response.status);
        sendJSON(res, 502, { error: "Zenserp provider error", results: [] });
        return;
      }

      var data = await response.json();

      if (!data || !Array.isArray(data.organic)) {
        sendJSON(res, 200, { results: [] });
        return;
      }

      var results = data.organic.slice(0, 6).map(function (r) {
        var rawUrl = r.url || r.destination || "";
        var hostname = "";
        try { hostname = new URL(rawUrl).hostname; } catch (e) { hostname = ""; }
        return {
          title: r.title || "",
          url: rawUrl,
          source: hostname,
          description: r.description || r.snippet || ""
        };
      });

      console.log("Proxy <- " + results.length + " results");
      sendJSON(res, 200, { results: results });
    } catch (err) {
      console.error("Proxy error:", err.message);
      sendJSON(res, 500, { error: "Internal error", results: [] });
    }
  });
}

var server = http.createServer(handleRequest);
server.listen(PORT, function () {
  console.log("Zenserp proxy running on http://localhost:" + PORT + "/api/zenserp");
});
