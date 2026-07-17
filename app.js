// Phase 4: subway map renderer — Layer 1 (overview) + Layer 2 (station focus).
// Layer 3/4 (concept + drugs / pros-cons) are stubbed here; full build is Phase 5.

const SVG_NS = "http://www.w3.org/2000/svg";

// Hand-tuned layout — station positions are presentational, not content,
// so they live here rather than in content.json (real subway maps aren't
// geographically accurate either — clarity beats precision).
const LAYOUT = {
  viewBox: "0 0 1000 460",
  linePaths: {
    oncology: "80,150 190,150 220,250 250,150 360,150 500,150 640,150 780,150 920,150",
    immunology: "140,350 220,250 300,350 380,350 520,350",
  },
  areaLabelPos: {
    oncology: { x: 80, y: 120 },
    immunology: { x: 140, y: 400 },
  },
  stationPos: {
    "targeted-mab": { x: 80, y: 150 },
    "adc": { x: 220, y: 250 },
    "bispecific-ab": { x: 360, y: 150 },
    "cell-therapy": { x: 500, y: 150 },
    "small-molecule": { x: 640, y: 150 },
    "checkpoint-inhibitor": { x: 780, y: 150 },
    "radioligand-therapy": { x: 920, y: 150 },
    "anti-cytokine-mab": { x: 380, y: 350 },
    "jak-inhibitor": { x: 520, y: 350 },
  },
};

let state = {
  data: null,
  selectedArea: null, // null = overview
  selectedStation: null,
};

async function loadAtlas() {
  const statusEl = document.getElementById("status");
  const app = document.getElementById("app");

  try {
    const res = await fetch("data/content.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.data = await res.json();

    statusEl.remove();
    buildMap(app);
    wireToolbar();
  } catch (err) {
    statusEl.textContent = `Failed to load content.json: ${err.message}`;
    statusEl.style.color = "crimson";
  }
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function buildMap(app) {
  const svg = svgEl("svg", { id: "subway-map", viewBox: LAYOUT.viewBox });

  state.data.areas.forEach((area) => {
    const path = LAYOUT.linePaths[area.id];
    if (!path) return;
    const line = svgEl("polyline", {
      points: path,
      class: "line-path",
      stroke: area.color,
      "data-area": area.id,
    });
    line.addEventListener("click", () => selectArea(area.id));
    svg.appendChild(line);
  });

  state.data.areas.forEach((area) => {
    const pos = LAYOUT.areaLabelPos[area.id];
    if (!pos) return;
    const label = svgEl("text", {
      x: pos.x,
      y: pos.y,
      class: "area-label",
      fill: area.color,
      "data-area": area.id,
    });
    label.textContent = area.name;
    label.addEventListener("click", () => selectArea(area.id));
    svg.appendChild(label);
  });

  state.data.modalities.forEach((mod) => {
    const pos = LAYOUT.stationPos[mod.id];
    if (!pos) return;
    const isInterchange = mod.areas.length > 1;
    const primaryColor = state.data.areas.find((a) => a.id === mod.areas[0])?.color || "#333";

    const dot = svgEl("circle", {
      cx: pos.x,
      cy: pos.y,
      r: isInterchange ? 10 : 7,
      class: "station-dot hidden-station" + (isInterchange ? " interchange-dot" : ""),
      fill: isInterchange ? "#fff" : primaryColor,
      "data-station": mod.id,
    });
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      selectStation(mod.id);
    });
    svg.appendChild(dot);

    const label = svgEl("text", {
      x: pos.x,
      y: pos.y - 16,
      "text-anchor": "middle",
      class: "station-label hidden-station",
      "data-station-label": mod.id,
    });
    label.textContent = mod.name;
    svg.appendChild(label);

    if (mod.stubOnly) {
      const sub = svgEl("text", {
        x: pos.x,
        y: pos.y + 24,
        "text-anchor": "middle",
        class: "station-sublabel hidden-station",
        "data-station-sublabel": mod.id,
      });
      sub.textContent = "stub — content pending";
      svg.appendChild(sub);
    }
  });

  app.innerHTML = "";
  app.appendChild(svg);
}

function selectArea(areaId) {
  state.selectedArea = areaId;
  state.selectedStation = null;
  applyFocusState();
  document.getElementById("back-btn").classList.remove("hidden");
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("subtitle").textContent =
    `Viewing the ${state.data.areas.find((a) => a.id === areaId).name} line — tap a station`;
}

function backToOverview() {
  state.selectedArea = null;
  state.selectedStation = null;
  applyFocusState();
  document.getElementById("back-btn").classList.add("hidden");
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("subtitle").textContent = "Tap a line to explore its modalities";
}

function applyFocusState() {
  const svg = document.getElementById("subway-map");
  const { selectedArea } = state;

  svg.querySelectorAll(".line-path").forEach((el) => {
    const isActive = !selectedArea || el.dataset.area === selectedArea;
    el.classList.toggle("faded", !isActive);
  });

  svg.querySelectorAll(".area-label").forEach((el) => {
    const isActive = !selectedArea || el.dataset.area === selectedArea;
    el.classList.toggle("faded", !isActive);
  });

  state.data.modalities.forEach((mod) => {
    const belongsToSelected = selectedArea && mod.areas.includes(selectedArea);
    const dot = svg.querySelector(`[data-station="${mod.id}"]`);
    const label = svg.querySelector(`[data-station-label="${mod.id}"]`);
    const sub = svg.querySelector(`[data-station-sublabel="${mod.id}"]`);

    [dot, label, sub].forEach((el) => {
      if (!el) return;
      el.classList.toggle("hidden-station", !belongsToSelected);
    });

    if (dot) dot.classList.toggle("selected", mod.id === state.selectedStation);
  });
}

function selectStation(modId) {
  state.selectedStation = modId;
  applyFocusState();

  const mod = state.data.modalities.find((m) => m.id === modId);
  const panel = document.getElementById("detail-panel");
  panel.classList.remove("hidden");

  if (mod.stubOnly) {
    panel.innerHTML = `
      <h3>${mod.name}</h3>
      <p class="placeholder-note">Stub station — full content not yet authored.</p>
    `;
    return;
  }

  panel.innerHTML = `
    <h3>${mod.name}</h3>
    <p>${mod.concept}</p>
    <p class="placeholder-note">Full Layer 3/4 view (concept + example drugs / pros-cons buttons) is built in Phase 5. This is a preview of the data only.</p>
  `;
}

function wireToolbar() {
  document.getElementById("back-btn").addEventListener("click", backToOverview);
}

loadAtlas();
