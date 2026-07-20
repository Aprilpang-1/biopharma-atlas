// Phase 5b: fixes station label overlap by widening spacing and wrapping
// long modality names onto two lines.

const SVG_NS = "http://www.w3.org/2000/svg";

// Hand-tuned layout - station positions are presentational, not content,
// so they live here rather than in content.json.
const LAYOUT = {
  viewBox: "0 0 1300 460",
  linePaths: {
    oncology: "60,150 190,150 220,250 250,150 400,150 580,150 780,150 1000,150 1220,150",
    immunology: "140,350 220,250 340,350 420,350 600,350"
  },
  areaLabelPos: {
    oncology: { x: 60, y: 120 },
    immunology: { x: 140, y: 400 }
  },
  stationPos: {
    "targeted-mab": { x: 60, y: 150 },
    "adc": { x: 220, y: 250 },
    "bispecific-ab": { x: 400, y: 150 },
    "cell-therapy": { x: 580, y: 150 },
    "small-molecule": { x: 780, y: 150 },
    "checkpoint-inhibitor": { x: 1000, y: 150 },
    "radioligand-therapy": { x: 1220, y: 150 },
    "anti-cytokine-mab": { x: 420, y: 350 },
    "jak-inhibitor": { x: 600, y: 350 }
  }
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

function buildMap(app) {
  var svg = svgEl("svg", { id: "subway-map", viewBox: LAYOUT.viewBox });

  state.data.areas.forEach(function (area) {
    var path = LAYOUT.linePaths[area.id];
    if (!path) return;
    var line = svgEl("polyline", {
      points: path,
      class: "line-path",
      stroke: area.color,
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
      r: isInterchange ? 10 : 7,
      class: "station-dot hidden-station" + (isInterchange ? " interchange-dot" : ""),
      fill: isInterchange ? "#fff" : primaryColor,
      "data-station": mod.id
    });
    dot.addEventListener("click", function (e) {
      e.stopPropagation();
      selectStation(mod.id);
    });
    svg.appendChild(dot);

    var lines = wrapLabel(mod.name);
    var baseY = pos.y - (lines.length > 1 ? 30 : 16);
    lines.forEach(function (lineText, i) {
      var label = svgEl("text", {
        x: pos.x,
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

  app.innerHTML = "";
  app.appendChild(svg);
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
