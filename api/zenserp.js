const https = require("https");

const ZENSERP_KEY = "7c138bd0-7d35-11f1-aee8-ffbee26008df";
const ZENSERP_HOST = "app.zenserp.com";
const ZENSERP_PATH = "/api/v2/search";

const SEARCH_SITES = ["zameen.com", "graana.com", "agency21.com", "lamudi.pk"];

function buildQuery(params) {
  var parts = [];
  var sf = SEARCH_SITES.map(function (s) { return "site:" + s; }).join(" OR ");
  if (params.type && params.type !== "all" && params.type !== "") parts.push('"' + params.type + '"');
  if (params.bedrooms > 0) parts.push(params.bedrooms + " bedroom");
  if (params.area) parts.push('"' + params.area + '"');
  if (params.city) parts.push('"' + params.city + '"');
  if (params.maxPrice > 0) parts.push('"' + fmt(params.maxPrice) + '"');
  if (params.minPrice > 0) parts.push('"' + fmt(params.minPrice) + '"');
  if (params.bathrooms > 0) parts.push(params.bathrooms + " bathroom");
  if (parts.length === 0) parts.push("property for sale");
  return sf + " " + parts.join(" ");
}

function fmt(n) {
  if (!n) return "";
  if (n >= 10000000) return (n / 10000000).toFixed(1) + " Crore";
  if (n >= 100000) return (n / 100000).toFixed(1) + " Lakh";
  return n.toLocaleString();
}

function callZenserp(query) {
  return new Promise(function (resolve, reject) {
    var qs = "?q=" + encodeURIComponent(query) + "&apikey=" + ZENSERP_KEY + "&num=6";
    var opts = {
      hostname: ZENSERP_HOST,
      path: ZENSERP_PATH + qs,
      headers: { "User-Agent": "Mozilla/5.0" }
    };
    https.get(opts, function (res) {
      var data = "";
      res.on("data", function (c) { data += c; });
      res.on("end", function () {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end("");

  var body = "";
  req.on("data", function (c) { body += c; });
  req.on("end", async function () {
    var params;
    try {
      params = (JSON.parse(body).params) || {};
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON", results: [] });
    }

    var query = buildQuery(params);

    try {
      var data = await callZenserp(query);

      if (!data || !Array.isArray(data.organic)) {
        return res.status(200).json({ results: [] });
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

      return res.status(200).json({ results: results });
    } catch (err) {
      return res.status(500).json({ error: err.message, results: [] });
    }
  });
};
