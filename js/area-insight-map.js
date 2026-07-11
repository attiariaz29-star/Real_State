(function () {
  "use strict";

  var CITY_COORDS = {
    karachi: { lat: 24.8607, lng: 67.0011 },
    lahore: { lat: 31.5204, lng: 74.3587 },
    islamabad: { lat: 33.6844, lng: 73.0479 }
  };

  var AREA_COORDS = {
    "dha": { lat: 24.812, lng: 67.032 },
    "clifton": { lat: 24.806, lng: 67.065 },
    "gulshan": { lat: 24.928, lng: 67.093 },
    "pechs": { lat: 24.869, lng: 67.053 },
    "bahria town karachi": { lat: 24.87, lng: 66.99 },
    "dha phase 6": { lat: 24.806, lng: 67.065 },
    "dha defence": { lat: 24.812, lng: 67.032 },
    "gulshan-e-iqbal": { lat: 24.928, lng: 67.093 },
    "gulberg": { lat: 31.511, lng: 74.343 },
    "johar town": { lat: 31.466, lng: 74.278 },
    "dha lahore": { lat: 31.48, lng: 74.37 },
    "bahria town lahore": { lat: 31.36, lng: 74.36 },
    "f-10": { lat: 33.706, lng: 73.042 },
    "f-7": { lat: 33.725, lng: 73.07 },
    "f-6": { lat: 33.742, lng: 73.076 },
    "g-9": { lat: 33.654, lng: 73.049 },
    "bahria town islamabad": { lat: 33.508, lng: 73.205 },
    "dha islamabad": { lat: 33.55, lng: 73.12 }
  };

  var TYPE_COLORS = {
    House: "#f59e0b",
    Flat: "#3b82f6",
    Apartment: "#3b82f6",
    Plot: "#22c55e",
    Commercial: "#ef4444",
    Penthouse: "#a855f7",
    Office: "#8b5cf6",
    Shop: "#ec4899",
    Villa: "#14b8a6"
  };

  function normalize(str) {
    return (str || "").toLowerCase().trim();
  }

  function matchAreaCoords(property) {
    var loc = normalize(property.location || "") + " " + normalize(property.area || "") + " " + normalize(property.city || "");
    for (var key in AREA_COORDS) {
      if (loc.indexOf(key) !== -1) return AREA_COORDS[key];
    }
    return null;
  }

  function getCityCoords(cityName) {
    var key = normalize(cityName);
    for (var c in CITY_COORDS) {
      if (key.indexOf(c) !== -1 || c.indexOf(key) !== -1) return CITY_COORDS[c];
    }
    return { lat: 30.3753, lng: 69.3451 };
  }

  function formatPrice(price, category) {
    if (!price) return "";
    if (category === "For Rent" || category === "rent") {
      return price >= 100000 ? "PKR " + (price / 100000).toFixed(1) + " Lakh/mo" : "PKR " + Number(price).toLocaleString() + "/mo";
    }
    return price >= 10000000 ? "PKR " + (price / 10000000).toFixed(2) + " Crore" : "PKR " + (price / 100000).toFixed(1) + " Lakh";
  }

  function getMarkerColor(type) {
    return TYPE_COLORS[type] || "#f59e0b";
  }

  function createPopupHtml(p) {
    var img = p.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=60";
    var type = p.type || "Property";
    var cat = p.category ? p.category : (p.purpose || "");
    var loc = p.location || p.area || "";
    var price = formatPrice(p.price, p.category || p.purpose);
    var beds = p.bedrooms ? p.bedrooms + " Bed" : "";
    var baths = p.bathrooms ? p.bathrooms + " Bath" : "";
    var area = p.areaSize || p.area || "";
    var link = "listing.html?id=" + (p.firebaseKey || p.id);
    return (
      '<div style="min-width:200px;">' +
        '<img src="' + img + '" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display=\'none\'">' +
        '<div style="font-weight:700;font-size:0.95rem;color:#f59e0b;">' + price + "</div>" +
        '<div style="font-size:0.82rem;color:#e5e7eb;margin:2px 0;">' + (p.title || type) + "</div>" +
        '<div style="font-size:0.78rem;color:#9ca3af;">' +
          (loc ? '<i class="bi bi-geo-alt" style="color:#f59e0b;"></i> ' + loc + "<br>" : "") +
          (beds || baths ? beds + (beds && baths ? " | " : "") + baths + "<br>" : "") +
          (cat ? '<span style="background:rgba(245,158,11,0.15);padding:1px 6px;border-radius:4px;">' + cat + "</span>" : "") +
        "</div>" +
        '<a href="' + link + '" target="_blank" style="display:inline-block;margin-top:6px;padding:4px 12px;background:#f59e0b;color:#000;border-radius:50px;text-decoration:none;font-size:0.75rem;font-weight:600;">View Details</a>' +
      "</div>"
    );
  }

  function initMap() {
    var mapEl = document.getElementById("leafletMap");
    var inputEl = document.getElementById("mapCityInput");
    var searchBtn = document.getElementById("mapSearchBtn");
    var statusEl = document.getElementById("mapStatus");
    var countBadge = document.getElementById("mapCount");

    if (!mapEl || !inputEl || !searchBtn) return;

    var map = L.map(mapEl, { zoomControl: true }).setView([30.3753, 69.3451], 5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>, &copy; <a href="https://carto.com">CARTO</a>'
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);

    setTimeout(function () { map.invalidateSize(); }, 200);
    window.addEventListener("resize", function () { map.invalidateSize(); });

    var allProperties = [];

    function loadProperties() {
      if (window.NestFinderAPI) {
        NestFinderAPI.fetchAll().then(function (props) {
          allProperties = props.filter(function (p) { return p.status !== "Disabled"; });
        }).catch(function () {
          allProperties = [];
        });
      }
    }

    function searchAndPlot() {
      var query = normalize(inputEl.value);
      if (!query) {
        statusEl.innerHTML = '<span style="color:#f59e0b;">Please enter a city name.</span>';
        return;
      }

      markersLayer.clearLayers();
      statusEl.innerHTML = "Searching for properties in <strong>" + query + "</strong>...";

      if (!allProperties.length) {
        NestFinderAPI.fetchAll().then(function (props) {
          allProperties = props.filter(function (p) { return p.status !== "Disabled"; });
          plotProperties(query);
        }).catch(function () {
          statusEl.innerHTML = "Could not load property data.";
        });
      } else {
        plotProperties(query);
      }
    }

    function plotProperties(query) {
      var matched = [];
      var unmatched = [];

      allProperties.forEach(function (p) {
        var loc = normalize(p.location || "") + " " + normalize(p.city || "") + " " + normalize(p.area || "");
        if (loc.indexOf(query) !== -1) {
          var coords = matchAreaCoords(p);
          if (coords) {
            matched.push({ property: p, coords: coords });
          } else {
            unmatched.push(p);
          }
        }
      });

      var totalFound = matched.length + unmatched.length;

      if (totalFound === 0) {
        statusEl.innerHTML = 'No properties found in <strong>' + query + "</strong>. Try a different city name.";
        if (countBadge) countBadge.textContent = "0 properties";
        return;
      }

      // Plot matched (area-level coords)
      matched.forEach(function (m) {
        var p = m.property;
        var color = getMarkerColor(p.type);
        var icon = L.divIcon({
          className: "",
          html: '<div style="background:' + color + ';width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#000;font-size:14px;font-weight:bold;border:2px solid rgba(0,0,0,0.3);box-shadow:0 2px 6px rgba(0,0,0,0.4);"><i class="bi bi-house-fill" style="font-size:12px;"></i></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        var marker = L.marker([m.coords.lat, m.coords.lng], { icon: icon }).addTo(markersLayer);
        marker.bindPopup(createPopupHtml(p));
      });

      // Plot unmatched at city center with different icon
      if (unmatched.length > 0) {
        var cityCenter = getCityCoords(query);
        unmatched.forEach(function (p) {
          var icon = L.divIcon({
            className: "",
            html: '<div style="background:rgba(245,158,11,0.4);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(245,158,11,0.6);box-shadow:0 1px 4px rgba(0,0,0,0.3);"><i class="bi bi-circle-fill" style="font-size:8px;color:#f59e0b;"></i></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          var jitter = (Math.random() - 0.5) * 0.02;
          var marker = L.marker([cityCenter.lat + jitter, cityCenter.lng + (Math.random() - 0.5) * 0.02], { icon: icon }).addTo(markersLayer);
          marker.bindPopup(createPopupHtml(p));
        });
      }

      // Zoom to fit all markers
      if (markersLayer.getLayers().length > 0) {
        var group = L.featureGroup(markersLayer.getLayers());
        map.fitBounds(group.getBounds().pad(0.1));
      }

      var coordsNote = unmatched.length > 0 ? " (" + unmatched.length + " at city center)" : "";
      statusEl.innerHTML = "Showing <strong>" + totalFound + "</strong> propert" + (totalFound === 1 ? "y" : "ies") + " in <strong>" + query + "</strong>" + coordsNote;
      if (countBadge) countBadge.textContent = totalFound + " propert" + (totalFound === 1 ? "y" : "ies");
    }

    searchBtn.addEventListener("click", searchAndPlot);
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") searchAndPlot();
    });

    loadProperties();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMap);
  } else {
    initMap();
  }
})();
