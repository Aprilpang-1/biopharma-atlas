// Phase 3 skeleton: just prove content.json loads and the data model works.
// No subway map rendering yet (that's Phase 4) — this is a flat, unstyled list.

async function loadAtlas() {
  const statusEl = document.getElementById("status");
  const app = document.getElementById("app");

  try {
    const res = await fetch("data/content.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    statusEl.remove();
    render(data, app);
  } catch (err) {
    statusEl.textContent = `Failed to load content.json: ${err.message}`;
    statusEl.style.color = "crimson";
  }
}

function render(data, app) {
  const { areas, modalities, exampleDrugs } = data;

  const drugById = Object.fromEntries(exampleDrugs.map((d) => [d.id, d]));

  areas.forEach((area) => {
    const areaModalities = modalities.filter((m) => m.areas.includes(area.id));

    const block = document.createElement("section");
    block.className = "area-block";
    block.style.setProperty("--area-color", area.color);

    const heading = document.createElement("h2");
    heading.textContent = area.name;
    heading.style.color = area.color;
    block.appendChild(heading);

    const count = document.createElement("p");
    count.textContent = `${areaModalities.length} modalities`;
    count.style.fontSize = "0.85rem";
    count.style.color = "#666";
    block.appendChild(count);

    const list = document.createElement("ul");
    list.className = "modality-list";

    areaModalities.forEach((mod) => {
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.className = "modality-name";
      nameSpan.textContent = mod.name;
      li.appendChild(nameSpan);

      if (mod.areas.length > 1) {
        const tag = document.createElement("span");
        tag.className = "interchange-tag";
        tag.textContent = "shared interchange";
        li.appendChild(tag);
      }

      if (mod.stubOnly) {
        const tag = document.createElement("span");
        tag.className = "stub-tag";
        tag.textContent = "stub — content pending";
        li.appendChild(tag);
      }

      if (mod.concept) {
        const concept = document.createElement("p");
        concept.textContent = mod.concept;
        concept.style.fontSize = "0.85rem";
        concept.style.color = "#444";
        concept.style.margin = "0.25rem 0 0";
        li.appendChild(concept);
      }

      if (mod.exampleDrugIds && mod.exampleDrugIds.length) {
        const drugs = document.createElement("p");
        drugs.style.fontSize = "0.8rem";
        drugs.style.color = "#888";
        drugs.style.margin = "0.25rem 0 0";
        drugs.textContent =
          "Example drugs: " +
          mod.exampleDrugIds
            .map((id) => {
              const d = drugById[id];
              return d ? `${d.name} (${d.company}, ${d.year})` : id;
            })
            .join(" · ");
        li.appendChild(drugs);
      }

      list.appendChild(li);
    });

    block.appendChild(list);
    app.appendChild(block);
  });
}

loadAtlas();
