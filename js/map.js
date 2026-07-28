/* =========================================================
   Map page (map.html)
   Reads data/timeline-data.json and two GeoJSON files:
     - data/world-countries.geojson  (world country boundaries)
     - data/india-states.geojson     (Indian state boundaries)
   See README.md → "Map page — GeoJSON files needed" for
   download instructions.

   State: mode (cumulative | snapshot) + view (world | india)
   + selectedYear drive everything. Changing any of them calls
   updateMap(), which re-aggregates data and re-styles layers.
   ========================================================= */

/* ---------------------------------------------------------
   Color system — all colors pulled from the site CSS palette
   No data:  #F7E7CE  (--paper-line)
   Low:      #FCA99C  (--salmon)
   Mid:      #770000  (--oxblood)
   High:     #520D1B  (--footer-bg)
   --------------------------------------------------------- */
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function interpolateColor(hex1, hex2, t) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

// Power scale so that regions with even a modest number get visible color,
// not just the one region with the maximum. Adjust the exponent (0.35) if
// the map looks too uniform once data is more populated.
function getHeatColor(value, maxValue) {
  if (!value || value <= 0 || !maxValue) return "#F7E7CE";
  const t = Math.pow(Math.min(value / maxValue, 1), 0.35);
  if (t < 0.5) {
    return interpolateColor("#FCA99C", "#770000", t * 2);
  } else {
    return interpolateColor("#770000", "#520D1B", (t - 0.5) * 2);
  }
}

/* ---------------------------------------------------------
   State
   --------------------------------------------------------- */
let allEntries = [];         // raw entries from timeline-data.json
let worldGeoJSON = null;     // world countries GeoJSON
let indiaGeoJSON = null;     // India states GeoJSON
let leafletMap = null;       // Leaflet map instance
let worldLayer = null;       // Leaflet geoJSON layer for world
let indiaLayer = null;       // Leaflet geoJSON layer for India

let currentMode = "cumulative"; // "cumulative" | "snapshot"
let currentView = "world";      // "world" | "india"
let selectedYear = null;        // null = show all; number = filter to that year

/* ---------------------------------------------------------
   Name normalisation
   The names in timeline-data.json's geography fields need to
   match the property names in the GeoJSON. Add entries here
   whenever you add a new country/state to the data whose name
   differs from how the GeoJSON spells it.
   --------------------------------------------------------- */
const COUNTRY_NAME_MAP = {
  // timeline-data.json value → GeoJSON ADMIN property value
  "India":       "India",
  "Bangladesh":  "Bangladesh",
  "Pakistan":    "Pakistan",
  "Nepal":       "Nepal",
  "Myanmar":     "Myanmar",
  "Sri Lanka":   "Sri Lanka",
  "Afghanistan": "Afghanistan",
};

const STATE_NAME_MAP = {
  // timeline-data.json value → GeoJSON ST_NM (or NAME_1) property value
  "Delhi":        "NCT of Delhi",
  "Maharashtra":  "Maharashtra",
  "Rajasthan":    "Rajasthan",
  "Gujarat":      "Gujarat",
  "West Bengal":  "West Bengal",
  "Punjab":       "Punjab",
  "Kashmir":      "Jammu & Kashmir",
  "Uttarakhand":  "Uttarakhand",
  "Haryana":      "Haryana",
  "Kerala":       "Kerala",
  "Meghalaya":    "Meghalaya",
  "Mizoram":      "Mizoram",
};

// Returns the GeoJSON property name string for a country name from our data.
function resolveCountry(name) {
  return COUNTRY_NAME_MAP[name] || name;
}

// Returns the GeoJSON property name string for a state name from our data.
function resolveState(name) {
  return STATE_NAME_MAP[name] || name;
}

/* ---------------------------------------------------------
   Data aggregation
   --------------------------------------------------------- */
function getFeatureName(feature, view) {
  // Try common GeoJSON property names for country/state.
  const p = feature.properties;
  if (view === "world") {
    return p.ADMIN || p.admin || p.NAME || p.name || p.name_long || "";
  } else {
    return p.ST_NM || p.NAME_1 || p.name || p.NAME || "";
  }
}

// Filter entries by mode and year, then aggregate by country/state.
// Returns { regionName: { total: number, count: number } }
function aggregateEntries(view) {
  let filtered = allEntries;

  if (selectedYear !== null) {
    if (currentMode === "cumulative") {
      filtered = allEntries.filter((e) => e.sortYear <= selectedYear);
    } else {
      // Snapshot — show only entries from this exact year.
      filtered = allEntries.filter((e) => e.sortYear === selectedYear);
    }
  }

  const result = {};

  filtered.forEach((e) => {
    const country = e.geography && e.geography.country;
    const state = e.geography && e.geography.state;
    const num = e.number || 0;

    if (view === "world" && country) {
      const key = resolveCountry(country);
      if (!result[key]) result[key] = { total: 0, count: 0 };
      result[key].total += num;
      result[key].count += 1;
    }

    if (view === "india" && country === "India") {
      // state can be a string or an array (when an incident spans multiple states)
      const states = Array.isArray(state)
        ? state
        : state ? [state] : [];
      states.forEach((s) => {
        const key = resolveState(s);
        if (!result[key]) result[key] = { total: 0, count: 0 };
        result[key].total += num;
        result[key].count += 1;
      });
    }

    // For the india view, also count entries that only have country=India
    // (no state), and attribute them to a special "India (nationwide)" bucket
    // which we won't render on the map but will count in the stats.
    if (view === "india" && country === "India" && !state) {
      const key = "_nationwide";
      if (!result[key]) result[key] = { total: 0, count: 0 };
      result[key].total += num;
      result[key].count += 1;
    }
  });

  return result;
}

/* ---------------------------------------------------------
   Map rendering
   --------------------------------------------------------- */
function styleFeature(feature, aggregated, maxValue, view) {
  const name = getFeatureName(feature, view);
  const data = aggregated[name];
  const value = data ? data.total : 0;
  return {
    fillColor: getHeatColor(value, maxValue),
    fillOpacity: value > 0 ? 0.85 : 0.3,
    color: "#520D1B",
    weight: 0.5,
    opacity: 0.4,
  };
}

function getEntriesForRegion(name, view) {
  let filtered = allEntries;
  if (selectedYear !== null) {
    filtered = currentMode === "cumulative"
      ? allEntries.filter((e) => e.sortYear <= selectedYear)
      : allEntries.filter((e) => e.sortYear === selectedYear);
  }
  return filtered.filter((e) => {
    if (!e.geography) return false;
    if (view === "world") return resolveCountry(e.geography.country) === name;
    const states = Array.isArray(e.geography.state)
      ? e.geography.state
      : e.geography.state ? [e.geography.state] : [];
    return e.geography.country === "India" && states.some((s) => resolveState(s) === name);
  });
}

function onFeatureHover(e, aggregated, view) {
  const layer = e.target;
  const name = getFeatureName(layer.feature, view);
  const data = aggregated[name];
  const infoEl = document.getElementById("map-info");

  layer.setStyle({
    weight: 2,
    opacity: 0.9,
    fillOpacity: data && data.total > 0 ? 0.95 : 0.4,
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  if (data && data.total > 0) {
    const regionEntries = getEntriesForRegion(name, view);
    const entryLinks = regionEntries
      .map((e) =>
        e.link
          ? `<a href="${e.link}" style="color:var(--oxblood);display:block;margin-top:0.35rem;font-family:var(--f-body);font-size:0.9rem;">
               &rarr; ${e.title} <span style="color:var(--oxblood-soft);font-size:0.8rem;">(${e.year})</span>
             </a>`
          : `<span style="display:block;margin-top:0.35rem;font-family:var(--f-body);font-size:0.9rem;">
               ${e.title} <span style="color:var(--oxblood-soft);font-size:0.8rem;">(${e.year})</span>
             </span>`
      )
      .join("");

    infoEl.innerHTML =
      `<strong>${name}</strong> &nbsp;—&nbsp; ` +
      `${formatNumber(data.total)} people affected across ` +
      `${data.count} documented ${data.count === 1 ? "entry" : "entries"}` +
      entryLinks;
  } else {
    infoEl.innerHTML =
      `<strong>${name}</strong> &nbsp;—&nbsp; ` +
      `<em>No entries documented for this ${view === "world" ? "country" : "state"} ` +
      `in the current selection.</em>`;
  }
}

function onFeatureOut(layer, aggregated, maxValue, view) {
  layer.setStyle(styleFeature(layer.feature, aggregated, maxValue, view));
}

function buildLayer(geoJSON, aggregated, maxValue, view) {
  return L.geoJSON(geoJSON, {
    style: (feature) => styleFeature(feature, aggregated, maxValue, view),
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: (e) => onFeatureHover(e, aggregated, view),
        mouseout:  (e) => onFeatureOut(e.target, aggregated, maxValue, view),
      });
    },
  });
}

/* ---------------------------------------------------------
   Stats panel
   --------------------------------------------------------- */
function updateStats(aggregated, view) {
  let totalPeople = 0;
  let totalEntries = 0;
  let countries = new Set();
  let states = new Set();

  // Re-filter raw entries for accurate counts
  let filtered = allEntries;
  if (selectedYear !== null) {
    if (currentMode === "cumulative") {
      filtered = allEntries.filter((e) => e.sortYear <= selectedYear);
    } else {
      filtered = allEntries.filter((e) => e.sortYear === selectedYear);
    }
  }

  filtered.forEach((e) => {
    totalPeople += e.number || 0;
    totalEntries += 1;
    if (e.geography && e.geography.country) countries.add(e.geography.country);
    if (e.geography && e.geography.state && e.geography.country === "India") {
      states.add(e.geography.state);
    }
  });

  document.getElementById("map-stat-incidents").textContent = totalEntries;
  document.getElementById("map-stat-people").textContent = formatNumber(totalPeople);
  document.getElementById("map-stat-countries").textContent = countries.size;
  document.getElementById("map-stat-states").textContent = states.size;
}

/* ---------------------------------------------------------
   Slider year range — derived from actual data
   --------------------------------------------------------- */
function updateSliderRange() {
  if (!allEntries.length) return;
  const years = allEntries.map((e) => e.sortYear).filter(Boolean);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const slider = document.getElementById("map-year-slider");
  slider.min = min;
  slider.max = max;
  slider.value = max;
  selectedYear = null; // start showing all data
  updateYearDisplay(max);
}

function updateYearDisplay(value) {
  const display = document.getElementById("map-year-display");
  if (selectedYear === null) {
    display.textContent = "All";
  } else {
    display.textContent = value;
  }
}

/* ---------------------------------------------------------
   Main update function — called whenever mode/view/year changes
   --------------------------------------------------------- */
function updateMap() {
  if (!leafletMap) return;

  const view = currentView;
  const geoJSON = view === "world" ? worldGeoJSON : indiaGeoJSON;

  if (!geoJSON) {
    document.getElementById("map-info").innerHTML =
      `<em>GeoJSON for ${view === "world" ? "world countries" : "India states"} ` +
      `not loaded yet. See README — "Map page — GeoJSON files needed".</em>`;
    return;
  }

  const aggregated = aggregateEntries(view);
  const maxValue = Math.max(
    ...Object.values(aggregated)
      .filter((_, k) => k !== "_nationwide")
      .map((d) => d.total),
    1
  );

  // Remove existing layer for this view and rebuild
  if (view === "world") {
    if (worldLayer) leafletMap.removeLayer(worldLayer);
    worldLayer = buildLayer(geoJSON, aggregated, maxValue, view).addTo(leafletMap);
  } else {
    if (indiaLayer) leafletMap.removeLayer(indiaLayer);
    indiaLayer = buildLayer(geoJSON, aggregated, maxValue, view).addTo(leafletMap);
  }

  updateStats(aggregated, view);
}

/* ---------------------------------------------------------
   View switching — world ↔ india
   --------------------------------------------------------- */
function switchView(view) {
  currentView = view;

  // Update button states
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });

  // Show/hide layers and fit bounds
  if (view === "world") {
    if (indiaLayer) leafletMap.removeLayer(indiaLayer);
    if (worldLayer) leafletMap.addLayer(worldLayer);
    if (worldGeoJSON) leafletMap.setView([20, 0], 2);
  } else {
    if (worldLayer) leafletMap.removeLayer(worldLayer);
    if (indiaLayer) leafletMap.addLayer(indiaLayer);
    // Fit to India bounds approximately
    leafletMap.setView([22, 80], 5);
  }

  updateMap();
}

/* ---------------------------------------------------------
   Utilities — reused from common.js conventions
   --------------------------------------------------------- */
function formatNumber(n) {
  if (typeof n !== "number") return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + " million";
  return n.toLocaleString("en-IN");
}

/* ---------------------------------------------------------
   Initialisation
   --------------------------------------------------------- */
async function initMap() {
  // --- Leaflet map setup ---
  leafletMap = L.map("map-container", {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
    attributionControl: true,
  });

  // Subtle OpenStreetMap tiles — light enough that choropleth colors dominate
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }
  ).addTo(leafletMap);

  // --- Load timeline data ---
  try {
    const res = await fetch("data/timeline-data.json");
    allEntries = await res.json();
    updateSliderRange();
  } catch (err) {
    console.error("Could not load timeline-data.json:", err);
    document.getElementById("map-info").innerHTML =
      "<em>Could not load timeline data. Run a local server to preview this page.</em>";
    return;
  }

  // --- Load GeoJSON files ---
  // These files need to be placed in your data/ folder.
  // See README → "Map page — GeoJSON files needed" for download links.
  try {
    const worldRes = await fetch("data/world-countries.geojson");
    worldGeoJSON = await worldRes.json();
  } catch (err) {
    console.warn("data/world-countries.geojson not found — world view unavailable.");
  }

  try {
    const indiaRes = await fetch("data/india-states.geojson");
    indiaGeoJSON = await indiaRes.json();
  } catch (err) {
    console.warn("data/india-states.geojson not found — India view unavailable.");
  }

  // --- Wire up controls ---

  // Mode toggle (cumulative / snapshot)
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((b) =>
        b.classList.toggle("is-active", b.dataset.mode === currentMode)
      );
      updateMap();
    });
  });

  // View toggle (world / india)
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Year slider
  const slider = document.getElementById("map-year-slider");
  const yearDisplay = document.getElementById("map-year-display");

  // Slider at max = "show all" (no year filter)
  slider.addEventListener("input", () => {
    const val = parseInt(slider.value);
    if (val >= parseInt(slider.max)) {
      selectedYear = null;
      yearDisplay.textContent = "All";
    } else {
      selectedYear = val;
      yearDisplay.textContent = val;
    }
    updateMap();
  });

  // --- Initial render ---
  updateMap();
}

document.addEventListener("DOMContentLoaded", initMap);
