// Phase 7: NYC-subway-style redesign. All lines are routed on strict
// 0/45/90-degree segments only (octilinear routing, like Jug Cerovic's
// INAT-style transit maps) so the map reads as a real metro diagram.

const SVG_NS = "http://www.w3.org/2000/svg";

// Hand-tuned layout - station positions are presentational, not content,
// so they live here rather than in content.json.
const LAYOUT = {
  viewBox: "0 0 1300 860",
  linePaths: {
    // fully straight - ADC sits directly on this line
    oncology: "60,180 1140,180",
    // starts right at ADC (no leftward stub) - a right-angle tick UP to sit
    // above Oncology, then straight across to its own stations
    immunology: "220,180 220,80 460,80 640,80",
    // pure right-angle (Manhattan) staircase - no diagonals. Approaches
    // RNAi Therapeutics vertically (from below) so it crosses Metabolic's
    // horizontal approach at a single point instead of running alongside it
    "rare-disease": "60,780 180,780 180,660 480,660 480,540 780,540 780,420 1080,420 1080,300",
    // aligned straight down from Targeted mAb (same x) to GLP-1, then a
    // clean right-angle turn across to Rare Disease (rnai-therapeutics)
    metabolic: "60,180 60,420 780,420"
  },
  areaLabelPos: {
    oncology: { x: 60, y: 130 },
    immunology: { x: 750, y: 80 },
    "rare-disease": { x: 60, y: 820 },
    metabolic: { x: 60, y: 460 }
  },
  stationPos: {
    "targeted-mab": { x: 60, y: 180 },
    "adc": { x: 220, y: 180 },
    "bispecific-ab": { x: 420, y: 180 },
    "cell-therapy": { x: 600, y: 180 },
    "small-molecule": { x: 780, y: 180 },
    "checkpoint-inhibitor": { x: 960, y: 180 },
    "radioligand-therapy": { x: 1140, y: 180 },
    "anti-cytokine-mab": { x: 460, y: 80 },
    "jak-inhibitor": { x: 640, y: 80 },
    "gene-therapy-aav": { x: 60, y: 780 },
    "enzyme-replacement-therapy": { x: 180, y: 660 },
    "aso": { x: 480, y: 540 },
    "rnai-therapeutics": { x: 780, y: 420 },
    "crispr-gene-editing": { x: 1080, y: 300 },
    "glp1-agonist": { x: 60, y: 420 }
  },
  // stations sitting where a straight-above label would cross the line -
  // render their label below the dot, or offset sideways, instead
  labelBelow: ["adc"],
  labelOffsetX: { "glp1-agonist": 65 }
};

var state = {
  data: null,
  selectedArea: null,
  selectedStation: null,
  detailView: null,
  pinned: [],
  comparing: false
};

function isPinned(modId) {
  return state.pinned.indexOf(modId) !== -1;
}

function togglePin(modId) {
  var idx = state.pinned.indexOf(modId);
  if (idx !== -1) {
    state.pinned.splice(idx, 1);
  } else {
    state.pinned.push(modId);
    if (state.pinned.length > 2) state.pinned.shift();
  }
  updateCompareButton();
  if (!state.comparing) renderDetailPanel();
}

function updateCompareButton() {
  var btn = document.getElementById("compare-btn");
  var countEl = document.getElementById("compare-count");
  countEl.textContent = state.pinned.length;
  btn.classList.toggle("hidden", state.pinned.length < 2);
}

function drugListHtml(mod) {
  var drugs = mod.exampleDrugIds.map(function (id) {
    return state.data.exampleDrugs.filter(function (d) { return d.id === id; })[0];
  });
  return drugs.map(function (d) {
    return "<li><span class=\"drug-name\">" + esc(d.name) + "</span><span class=\"drug-meta\">" + esc(d.company) + " &middot; " + d.year + "</span></li>";
  }).join("");
}

function compareCardHtml(mod) {
  var prosItems = mod.pros.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
  var consItems = mod.cons.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
  return (
    "<div class=\"compare-card\">" +
    "<h3>" + esc(mod.name) + "</h3>" +
    "<p>" + esc(mod.concept) + "</p>" +
    "<h4>Pros</h4><ul>" + prosItems + "</ul>" +
    "<h4>Cons</h4><ul>" + consItems + "</ul>" +
    "<p class=\"verdict\"><strong>Verdict:</strong> " + esc(mod.verdict) + "</p>" +
    "<h4>Example drugs</h4><ul class=\"drug-list\">" + drugListHtml(mod) + "</ul>" +
    "</div>"
  );
}

function showCompareView() {
  state.comparing = true;
  renderComparePanel();
}

function closeCompare() {
  state.comparing = false;
  renderDetailPanel();
}

function renderComparePanel() {
  var panel = document.getElementById("detail-panel");
  var mods = state.pinned.map(function (id) {
    return state.data.modalities.filter(function (m) { return m.id === id; })[0];
  });
  panel.classList.remove("hidden");
  panel.innerHTML =
    "<div class=\"compare-header\">" +
    "<h3>Comparing modalities</h3>" +
    "<button class=\"back-inline\" data-action=\"close-compare\">&times; Close comparison</button>" +
    "</div>" +
    "<div class=\"compare-grid\">" + mods.map(compareCardHtml).join("") + "</div>";
  var closeBtn = panel.querySelector('[data-action="close-compare"]');
  if (closeBtn) closeBtn.addEventListener("click", closeCompare);
}

function loadAtlas() {
  var statusEl = document.getElementById("status");
  var app = document.getElementById("app");

  fetch("data/content.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      state.data = data;
      statusEl.remove();
      buildMap(app);
      renderLegend();
      wireToolbar();
    })
    .catch(function (err) {
      statusEl.textContent = "Failed to load content.json: " + err.message;
      statusEl.style.color = "crimson";
    });
}

function svgEl(tag, attrs) {
  var el = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs || {}).forEach(function (k) {
    el.setAttribute(k, attrs[k]);
  });
  return el;
}

// Splits a long station name into up to two lines so labels don't collide
// horizontally. Short names stay on one line.
function wrapLabel(name) {
  if (name.length <= 14) return [name];

  var parenIdx = name.indexOf(" (");
  if (parenIdx !== -1) {
    return [name.slice(0, parenIdx), name.slice(parenIdx + 1)];
  }

  var mid = Math.floor(name.length / 2);
  var splitAt = -1;
  for (var d = 0; d < name.length; d++) {
    if (name.charAt(mid - d) === " ") { splitAt = mid - d; break; }
    if (name.charAt(mid + d) === " ") { splitAt = mid + d; break; }
  }
  if (splitAt === -1) return [name];
  return [name.slice(0, splitAt), name.slice(splitAt + 1)];
}

// Parses a "x,y x,y ..." points string into [{x,y}, ...].
function parsePoints(pointsStr) {
  return pointsStr.trim().split(/\s+/).map(function (p) {
    var xy = p.split(",");
    return { x: parseFloat(xy[0]), y: parseFloat(xy[1]) };
  });
}

// Builds a smooth-cornered SVG path "d" string from straight-segment
// points, like real transit maps - each interior corner is rounded with a
// quadratic curve instead of a sharp angle. Radius is clamped per-corner
// so it never exceeds half of either adjoining segment's length.
function roundedPathD(points, radius) {
  if (points.length < 2) return "";
  var d = "M " + points[0].x + " " + points[0].y + " ";
  for (var i = 1; i < points.length - 1; i++) {
    var prev = points[i - 1];
    var curr = points[i];
    var next = points[i + 1];

    var d1x = curr.x - prev.x, d1y = curr.y - prev.y;
    var len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    var d2x = next.x - curr.x, d2y = next.y - curr.y;
    var len2 = Math.sqrt(d2x * d2x + d2y * d2y);

    var r = Math.min(radius, len1 / 2, len2 / 2);

    var p1x = curr.x - (d1x / len1) * r;
    var p1y = curr.y - (d1y / len1) * r;
    var p2x = curr.x + (d2x / len2) * r;
    var p2y = curr.y + (d2y / len2) * r;

    d += "L " + p1x + " " + p1y + " ";
    d += "Q " + curr.x + " " + curr.y + " " + p2x + " " + p2y + " ";
  }
  var last = points[points.length - 1];
  d += "L " + last.x + " " + last.y + " ";
  return d;
}

var CORNER_RADIUS = 20;

function buildMap(app) {
  var svg = svgEl("svg", { id: "subway-map", viewBox: LAYOUT.viewBox });

  var vbParts = LAYOUT.viewBox.split(" ");
  svg.appendChild(svgEl("rect", {
    x: vbParts[0], y: vbParts[1], width: vbParts[2], height: vbParts[3],
    fill: "#fdfdfb", class: "map-background"
  }));

  state.data.areas.forEach(function (area) {
    var path = LAYOUT.linePaths[area.id];
    if (!path) return;
    var pts = parsePoints(path);
    var line = svgEl("path", {
      d: roundedPathD(pts, CORNER_RADIUS),
      class: "line-path",
      stroke: area.color,
      fill: "none",
      "data-area": area.id
    });
    line.addEventListener("click", function () {
      selectArea(area.id);
    });
    svg.appendChild(line);
  });

  state.data.areas.forEach(function (area) {
    var pos = LAYOUT.areaLabelPos[area.id];
    if (!pos) return;

    var badge = svgEl("circle", {
      cx: pos.x - 16,
      cy: pos.y - 6,
      r: 11,
      fill: area.color,
      class: "area-badge",
      "data-area": area.id
    });
    badge.addEventListener("click", function () {
      selectArea(area.id);
    });
    svg.appendChild(badge);

    var badgeText = svgEl("text", {
      x: pos.x - 16,
      y: pos.y - 1,
      "text-anchor": "middle",
      class: "area-badge-text",
      "data-area": area.id
    });
    badgeText.textContent = area.abbr || area.name.slice(0, 2).toUpperCase();
    svg.appendChild(badgeText);

    var label = svgEl("text", {
      x: pos.x,
      y: pos.y,
      class: "area-label",
      fill: area.color,
      "data-area": area.id
    });
    label.textContent = area.name;
    label.addEventListener("click", function () {
      selectArea(area.id);
    });
    svg.appendChild(label);
  });

  state.data.modalities.forEach(function (mod) {
    var pos = LAYOUT.stationPos[mod.id];
    if (!pos) return;
    var isInterchange = mod.areas.length > 1;
    var primaryArea = state.data.areas.filter(function (a) {
      return a.id === mod.areas[0];
    })[0];
    var primaryColor = primaryArea ? primaryArea.color : "#333";

    var dot = svgEl("circle", {
      cx: pos.x,
      cy: pos.y,
      r: isInterchange ? 11 : 6,
      class: "station-dot hidden-station" + (isInterchange ? " interchange-dot" : ""),
      fill: "#fff",
      stroke: isInterchange ? "#111" : primaryColor,
      "stroke-width": isInterchange ? 4 : 3,
      "data-station": mod.id
    });
    dot.addEventListener("click", function (e) {
      e.stopPropagation();
      selectStation(mod.id);
    });
    svg.appendChild(dot);

    var lines = wrapLabel(mod.name);
    var labelBelow = LAYOUT.labelBelow && LAYOUT.labelBelow.indexOf(mod.id) !== -1;
    var baseY = labelBelow
      ? pos.y + (lines.length > 1 ? 70 : 22)
      : pos.y - (lines.length > 1 ? 30 : 16);
    var labelX = pos.x + ((LAYOUT.labelOffsetX && LAYOUT.labelOffsetX[mod.id]) || 0);
    lines.forEach(function (lineText, i) {
      var label = svgEl("text", {
        x: labelX,
        y: baseY + i * 15,
        "text-anchor": "middle",
        class: "station-label hidden-station",
        "data-station-label": mod.id
      });
      label.textContent = lineText;
      svg.appendChild(label);
    });

    if (mod.stubOnly) {
      var sub = svgEl("text", {
        x: pos.x,
        y: pos.y + 24,
        "text-anchor": "middle",
        class: "station-sublabel hidden-station",
        "data-station-sublabel": mod.id
      });
      sub.textContent = "stub - content pending";
      svg.appendChild(sub);
    }
  });

  svg.appendChild(svgEl("rect", {
    x: parseFloat(vbParts[0]) + 2,
    y: parseFloat(vbParts[1]) + 2,
    width: parseFloat(vbParts[2]) - 4,
    height: parseFloat(vbParts[3]) - 4,
    fill: "none",
    stroke: "#111",
    "stroke-width": 4,
    rx: 6,
    class: "map-frame"
  }));

  app.innerHTML = "";
  app.appendChild(svg);
}

function renderLegend() {
  var el = document.getElementById("map-legend");
  if (!el) return;
  var items = state.data.areas.map(function (area) {
    return (
      "<span class=\"legend-item\">" +
      "<span class=\"legend-swatch\" style=\"background:" + area.color + "\">" + esc(area.abbr || "") + "</span>" +
      esc(area.name) +
      "</span>"
    );
  }).join("");
  el.innerHTML = "<span class=\"legend-label\">Lines:</span>" + items;
}

function selectArea(areaId) {
  state.selectedArea = areaId;
  state.selectedStation = null;
  state.detailView = null;
  state.comparing = false;
  applyFocusState();
  document.getElementById("back-btn").classList.remove("hidden");
  document.getElementById("detail-panel").classList.add("hidden");
  var areaObj = state.data.areas.filter(function (a) { return a.id === areaId; })[0];
  document.getElementById("subtitle").textContent =
    "Viewing the " + areaObj.name + " line - tap a station";
}

function backToOverview() {
  state.selectedArea = null;
  state.selectedStation = null;
  state.detailView = null;
  state.comparing = false;
  applyFocusState();
  document.getElementById("back-btn").classList.add("hidden");
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("subtitle").textContent = "Tap a line to explore its modalities";
}

function backToStationList() {
  state.selectedStation = null;
  state.detailView = null;
  state.comparing = false;
  applyFocusState();
  document.getElementById("detail-panel").classList.add("hidden");
}

function applyFocusState() {
  var svg = document.getElementById("subway-map");
  var selectedArea = state.selectedArea;

  svg.querySelectorAll(".line-path").forEach(function (el) {
    var isActive = !selectedArea || el.dataset.area === selectedArea;
    el.classList.toggle("faded", !isActive);
  });

  svg.querySelectorAll(".area-label").forEach(function (el) {
    var isActive = !selectedArea || el.dataset.area === selectedArea;
    el.classList.toggle("faded", !isActive);
  });

  svg.querySelectorAll(".area-badge, .area-badge-text").forEach(function (el) {
    var isActive = !selectedArea || el.dataset.area === selectedArea;
    el.classList.toggle("faded", !isActive);
  });

  state.data.modalities.forEach(function (mod) {
    var belongsToSelected = selectedArea && mod.areas.indexOf(selectedArea) !== -1;
    var dot = svg.querySelector('[data-station="' + mod.id + '"]');
    var labels = svg.querySelectorAll('[data-station-label="' + mod.id + '"]');
    var sub = svg.querySelector('[data-station-sublabel="' + mod.id + '"]');

    var isSelected = mod.id === state.selectedStation;

    if (dot) dot.classList.toggle("hidden-station", !belongsToSelected);
    labels.forEach(function (el) {
      el.classList.toggle("hidden-station", !belongsToSelected);
      el.classList.toggle("selected", isSelected);
    });
    if (sub) sub.classList.toggle("hidden-station", !belongsToSelected);

    if (dot) dot.classList.toggle("selected", isSelected);
  });
}

function selectStation(modId) {
  state.selectedStation = modId;
  state.detailView = "concept";
  state.comparing = false;
  applyFocusState();
  renderDetailPanel();
}

function esc(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function breadcrumbHtml(area, mod, extra) {
  var parts = [
    '<span class="crumb" data-action="all-lines">All lines</span>',
    '<span class="crumb-sep">&rsaquo;</span>',
    '<span class="crumb" data-action="area">' + esc(area.name) + "</span>"
  ];
  if (extra) {
    parts.push(
      '<span class="crumb-sep">&rsaquo;</span>',
      '<span class="crumb" data-action="concept">' + esc(mod.name) + "</span>",
      '<span class="crumb-sep">&rsaquo;</span>',
      '<span class="crumb current">' + esc(extra) + "</span>"
    );
  } else {
    parts.push(
      '<span class="crumb-sep">&rsaquo;</span>',
      '<span class="crumb current">' + esc(mod.name) + "</span>"
    );
  }
  return '<nav class="breadcrumb">' + parts.join("") + "</nav>";
}

function renderDetailPanel() {
  var panel = document.getElementById("detail-panel");
  if (!state.selectedStation) {
    panel.classList.add("hidden");
    return;
  }

  var mod = state.data.modalities.filter(function (m) { return m.id === state.selectedStation; })[0];
  var area = state.data.areas.filter(function (a) { return a.id === state.selectedArea; })[0];
  panel.classList.remove("hidden");

  if (mod.stubOnly) {
    panel.innerHTML =
      breadcrumbHtml(area, mod) +
      "<h3>" + esc(mod.name) + "</h3><p class=\"placeholder-note\">Stub station - full content not yet authored.</p>";
    wireBreadcrumb();
    return;
  }

  if (state.detailView === "drugs") {
    var drugs = mod.exampleDrugIds.map(function (id) {
      return state.data.exampleDrugs.filter(function (d) { return d.id === id; })[0];
    });
    var drugItems = drugs.map(function (d) {
      return "<li><span class=\"drug-name\">" + esc(d.name) + "</span><span class=\"drug-meta\">" + esc(d.company) + " &middot; " + d.year + "</span></li>";
    }).join("");
    panel.innerHTML =
      breadcrumbHtml(area, mod, "Example drugs") +
      "<h3>" + esc(mod.name) + " - Example drugs</h3>" +
      "<ul class=\"drug-list\">" + drugItems + "</ul>" +
      "<button class=\"back-inline\" data-action=\"back-to-concept\">&larr; Back to concept</button>";
  } else if (state.detailView === "proscons") {
    var prosItems = mod.pros.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
    var consItems = mod.cons.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    panel.innerHTML =
      breadcrumbHtml(area, mod, "Pros / Cons") +
      "<h3>" + esc(mod.name) + " - Pros / Cons</h3>" +
      "<div class=\"proscons-grid\">" +
      "<div class=\"proscons-col pros-col\"><h4>Pros</h4><ul>" + prosItems + "</ul></div>" +
      "<div class=\"proscons-col cons-col\"><h4>Cons</h4><ul>" + consItems + "</ul></div>" +
      "</div>" +
      "<p class=\"verdict\"><strong>Verdict:</strong> " + esc(mod.verdict) + "</p>" +
      "<button class=\"back-inline\" data-action=\"back-to-concept\">&larr; Back to concept</button>";
  } else {
    var schematic = "";
    if (mod.schematicParts && mod.schematicParts.length) {
      schematic = "<p class=\"schematic-caption\">Built from: " + mod.schematicParts.map(esc).join(" &middot; ") + "</p>";
    }
    var pinLabel = isPinned(mod.id) ? "📌 Pinned" : "📌 Pin to compare";
    panel.innerHTML =
      breadcrumbHtml(area, mod) +
      "<div class=\"layer3-heading\">" +
      "<h3>" + esc(mod.name) + "</h3>" +
      "<button class=\"pin-btn" + (isPinned(mod.id) ? " pinned" : "") + "\" data-action=\"toggle-pin\" data-mod=\"" + esc(mod.id) + "\">" + pinLabel + "</button>" +
      "</div>" +
      "<p>" + esc(mod.concept) + "</p>" +
      schematic +
      "<div class=\"layer3-buttons\">" +
      "<button data-view=\"drugs\">💊 Example drugs</button>" +
      "<button data-view=\"proscons\">⚖ Pros / Cons</button>" +
      "</div>";
  }

  wirePanelButtons();
}

function wireBreadcrumb() {
  document.querySelectorAll(".crumb[data-action]").forEach(function (el) {
    el.addEventListener("click", function () {
      var action = el.dataset.action;
      if (action === "all-lines") backToOverview();
      else if (action === "area") backToStationList();
      else if (action === "concept") {
        state.detailView = "concept";
        renderDetailPanel();
      }
    });
  });
}

function wirePanelButtons() {
  wireBreadcrumb();
  document.querySelectorAll("#detail-panel button[data-view]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.detailView = btn.dataset.view;
      renderDetailPanel();
    });
  });
  var backBtn = document.querySelector('#detail-panel [data-action="back-to-concept"]');
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      state.detailView = "concept";
      renderDetailPanel();
    });
  }
  var pinBtn = document.querySelector('#detail-panel [data-action="toggle-pin"]');
  if (pinBtn) {
    pinBtn.addEventListener("click", function () {
      togglePin(pinBtn.dataset.mod);
    });
  }
}

function wireToolbar() {
  document.getElementById("back-btn").addEventListener("click", backToOverview);
  document.getElementById("compare-btn").addEventListener("click", showCompareView);
}

loadAtlas();
