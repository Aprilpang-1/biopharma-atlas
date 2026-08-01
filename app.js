// Phase 7: NYC-subway-style redesign. All lines are routed on strict
// 0/45/90-degree segments only (octilinear routing, like Jug Cerovic's
// INAT-style transit maps) so the map reads as a real metro diagram.

const SVG_NS = "http://www.w3.org/2000/svg";

// Hand-tuned layout - station positions are presentational, not content,
// so they live here rather than in content.json.
const LAYOUT = {
  // widened on the right to give Vaccines/Infectious Disease its own open
  // column (x:1350-1550) - it's the one fully green-field area with no
  // interchanges into the existing network, so it doesn't need to route
  // around anything else. Extra width beyond the column itself is for its
  // long full-name legend ("Vaccines / Infectious Disease"), which needs
  // more horizontal room than any other area label on this map.
  // Heightened to fit Ophthalmology's new 2x2 station grid, plus the
  // bottom-left corner legend box below it.
  // Widened left (-160 -> -250) so ARNI (Heart Failure)'s label has real
  // room instead of crowding the frame border. Heightened further at the
  // top (-50 -> -70) so Cardiovascular's line can move up again (y:-20 ->
  // y:-55) while Vaccines/Infectious Disease's own top run drops low
  // enough (y:55 -> y:15) to clear JAK/Integrin/FcRn Inhibitor's label
  // text, not just their dots - the two lines still keep a healthy ~70
  // unit gap between them.
  viewBox: "-250 -70 2150 1090",
  linePaths: {
    // small notches at each multi-tone stop (Targeted mAb, ADC, Bispecific
    // Ab) so the line visibly crosses its own color dot within the pill
    // marker instead of the pill's generic center
    // Targeted mAb reorder: Oncology is now the middle (3rd) dot at
    // y:180 - exactly the pill's own center. ADC and Bispecific Ab's own
    // station centers are now offset (see stationPos) so Oncology's dot
    // lands on y:180 in every one of these pills too - the entire row
    // from Targeted mAb to Radioligand Therapy is one perfectly straight
    // line with zero notches.
    oncology: "60,180 1140,180",
    // runs parallel to (just above) Oncology from Targeted mAb to ADC -
    // both are genuine interchanges. Offset (12px, matching the standard
    // tone spacing) chosen to match the visible gap between parallel lines
    // on the NYC subway map reference - then dips down to actually touch
    // the ADC dot before turning up (JAK Inhibitor sits right at that
    // right-angle corner), then straight across through the rest.
    // Targeted mAb reorder: Immunology is now the 2nd dot at y:168, so the
    // line starts directly at its own dot instead of jogging up to it.
    // ADC's own center moved to y:174 (see stationPos) so Immunology's dot
    // there (tone0, the -6 offset) lands exactly on y:168 - the same
    // height as this line's own corridor - so the approach from Targeted
    // mAb is one continuous straight run with no dip needed at all; the
    // turn up toward JAK Inhibitor happens right at the dot, hidden under
    // the pill's opaque fill either way.
    immunology: "60,168 220,168 220,80 440,80 440,74 480,74 480,80 820,80 1000,80",
    // pure right-angle (Manhattan) staircase - no diagonals. ASO sits
    // directly under RNAi Therapeutics (same x), Enzyme Replacement sits
    // where ASO used to be, and AAV anchors the line below Enzyme
    // CRISPR sits on the same horizontal run as RNAi Therapeutics - no
    // right-angle turn at the end, just a straight continuation. Small
    // vertical notches at AAV, ASO, RNAi Therapeutics and CRISPR line it
    // up with its own dot's offset at each of those four interchanges
    // Rare Disease is now the bottom dot at RNAi Therapeutics (offset
    // +12 = y:426), so the vertical approach stops there instead of
    // continuing up to CRISPR's own offset (414) while still inside/
    // exiting the pill - that made the line's visible exit height match
    // Metabolic's dot (414) instead of its own. The transition to CRISPR's
    // offset now happens in the open gap between the two stations instead.
    // The turn from vertical to horizontal now happens early, at x:700 -
    // well clear of the pill - instead of right at the dot. That leaves a
    // long straight 200px run at y:426 that passes directly THROUGH the
    // dot as a plain interior point, with no corner-rounding at all right
    // at the touch point. A rounded corner (even a tight one) never
    // actually reaches its own vertex when turning 90 degrees, so no
    // amount of tightening the old turn-at-the-dot approach could fully
    // close the visual gap the pill's opaque fill leaves between the dot
    // and the resuming line - a straight pass-through has no such gap.
    // ASO touch was missing entirely - the old y:534 run only reached
    // x:700 before turning up, 80px short of ASO's own x:780, leaving that
    // dot completely disconnected from the line. Fixed by extending the
    // run out past ASO to x:830 (comfortably clear of its pill) before
    // doubling back to the same x:700 turn-up point that already gives
    // RNAi Therapeutics its clean pass-through - x:780 is now crossed
    // twice as a plain straight interior point (no rounding vertex sits
    // anywhere near it), so it's a genuine unrounded touch in both
    // directions, same technique as the parallel-line notches at ADC/
    // Bispecific Ab.
    "rare-disease": "480,762 480,540 480,534 830,534 700,534 700,426 900,426 900,414 960,414",
    // aligned straight down from Targeted mAb (same x) to GLP-1, forming a
    // T-junction there: a spur left to SGLT2 Inhibitor, then straight
    // across to the right through the rest of the line to Rare Disease
    // (rnai-therapeutics). Starts at Targeted mAb's own dot offset and
    // notches down to SGLT2's
    // Whole row (GLP-1, THR-beta Agonist, Insulin, RNAi Therapeutics) now
    // lives at y:414 - the same height as SGLT2's own offset dot - so the
    // descent from Targeted mAb lands directly on GLP-1, the SGLT2 spur
    // touches its dot with no dip at all, and the line runs straight
    // through to RNAi with zero jogs anywhere in between.
    // The SGLT2 hairpin now overshoots 8px past the dot (to x:-88) before
    // returning, instead of turning exactly at the dot (x:-80). A rounded
    // hairpin's visible curve only ever reaches halfway between its cut
    // points and the true corner, so turning AT the dot always fell short
    // and only grazed the pill's border - overshooting past the dot moves
    // that same shortfall past the point where it actually matters.
    metabolic: "60,204 60,414 -66,414 -88,414 -66,414 60,414 420,414 620,414 780,414",
    // Neuro touches two Rare Disease interchanges - ASO from the right
    // (spike out-and-back, same pattern as the Metabolic/SGLT2 spur) and
    // AAV from the right along the same row - without crossing either of
    // Rare Disease's own segments. Anti-CGRP Therapy sits right at the
    // T-junction where the spike branches off. Small notches align the
    // ASO and AAV touches with this line's own dot offset at each
    // ASO hairpin overshoots 10px past the dot (to x:770 instead of x:780)
    // so the curve's actual peak - which for a long symmetric hairpin like
    // this lands exactly 10px short of the vertex, per the roundedPathD
    // rounding math - reaches the true dot instead of stopping short of it.
    neuro: "1200,400 1200,540 1200,546 770,546 1200,546 1200,774 480,774",
    // redesigned onto its own dedicated column (x:-120, one full step left
    // of Metabolic's SGLT2 spur at x:-80) so it never runs alongside
    // Metabolic's line for any stretch - it only ever touches SGLT2 and
    // Targeted mAb via short spurs from the opposite side (mirroring
    // Metabolic's own spurs). From Targeted mAb it climbs to an open
    // corridor along the very top of the map (y:20, above Immunology's
    // row) and travels all the way across to RNAi Therapeutics, dropping
    // down to touch it from above - never running along Metabolic's own
    // y:420 row the way the old design did
    // notches to its own dot offset at both SGLT2 and Targeted mAb, and
    // ends at RNAi Therapeutics' offset instead of the pill's center - the
    // final approach shifts to x:770 (10px left of the pill's own x:780)
    // so this vertical run doesn't parallel-overlap Rare Disease's own
    // vertical approach into the same pill from x:780 above it, only
    // rejoining x:780 in a short final step that's hidden under the pill
    // dedicated column at x:-150. SGLT2 touch is a straight horizontal
    // out-and-back hairpin (matching Metabolic's own successful pattern)
    // with a 70px leg - long enough that the 20px corner-rounding only
    // "bulges" the last third of the approach out to the dot, instead of
    // consuming the whole leg into a tight closed loop like a 40px leg did
    // final target 780,402 matches Cardiovascular's own offset now that
    // RNAi Therapeutics' center moved from y:420 to y:414
    // Same overshoot fix as Metabolic's SGLT2 hairpin, mirrored: extends
    // 8px past the dot (to x:-72) before returning to the -150 column.
    // Targeted mAb touch redone as a short cut/overshoot spur (matching the
    // SGLT2 hairpin pattern exactly) instead of turning directly at the
    // dot's own coordinate - the old version cut the corner short (peak
    // only reached the pill's raw left border, not the dot itself, leaving
    // a visible gap). Cut point at x:30, vertex overshoots to x:70 (10px
    // past the dot at x:60) so the curve's actual deepest reach lands
    // exactly on the dot.
    // top run raised again, y:-20 to y:-55, so it stays well clear of
    // Vaccines/Infectious Disease's line even after ID's own run drops to
    // y:15 to clear the blue Immunology line's label text (see below)
    cardiovascular: "0,780 0,700 0,600 -150,600 -150,426 -94,426 -72,426 -94,426 -150,426 -150,192 30,192 70,192 30,192 -150,192 -150,-55 700,-55 700,250 780,250 780,402",
    // 2x2 grid: Complement Inhibitor sits left of AAV (same row), Anti-VEGF
    // sits directly under AAV (same column), Dry Eye Immunomodulator
    // mirrors that directly under Complement Inhibitor - a simple loop
    // through all four corners. Small notch aligns the AAV touch with
    // this line's own dot offset within that 4-way pill
    // Ophthalmology is now tone3 at AAV (y:798, swapped with Hematology)
    // Complement Inhibitor (Geographic Atrophy)'s dot moved from y:780 to
    // y:830 (see stationPos) - it sat only 6 units from Hematology's
    // horizontal run at y:786, nearly touching a line that isn't even its
    // own. Moved it DOWN rather than up so it doesn't run into April's own
    // hand-placed label for this station (pinned around y:746 on the pptx,
    // already sitting above the old dot position). The path now dips down
    // to 830 first, then still climbs to 798 to enter AAV's pill at
    // Ophthalmology's own tone offset (unrelated to Hematology).
    ophthalmology: "350,900 350,830 350,798 480,798 480,900",
    // runs along the open bottom strip (y:830) and spikes up to touch each
    // of its three interchanges from below - the one direction still open
    // on all three (Bispecific Ab from above/oncology, CRISPR Gene Editing
    // from above/left via Rare Disease, AAV from above/left/right via Rare
    // Disease, Neuro and Ophthalmology already). The long run to Bispecific
    // Ab is offset to x:395 (not 420) so it doesn't coincide with Thr-Beta
    // Agonist's dot, only jogging over to touch the real station at the end.
    // Each spike/touch lands at this line's own dot offset, not the
    // pill's generic center
    // CRISPR touch hairpin overshoots 10px past the dot (to y:416 instead
    // of y:426) - same rounding-shortfall fix as the ASO hairpin above.
    // Same technique as Oncology's straight run through Targeted mAb/ADC/
    // Bispecific Ab: instead of detouring to touch a dot that's offset
    // from this line's own height, move the CONNECTING station (PNH) so
    // the dot IS this line's own height. PNH shifted from y:830 to y:786
    // (see stationPos) - AAV's Hematology dot is already at y:786 (tone2
    // of the swapped order), so with PNH matching too, the entire PNH-
    // CRISPR-AAV stretch is one uninterrupted straight run at y:786, with
    // zero notch or detour anywhere - a genuinely straight line crossing
    // the dot, not an approximation of one.
    // vertical run moved from x:395 to x:240 (the midpoint between GLP-1
    // Receptor Agonist at x:60 and THR-beta Agonist at x:420) - x:395 was
    // only ~85-115 units from Enzyme Replacement Therapy's/Antifibrotic's
    // label text at their real rendered width, close enough to overlap it
    hematology: "1050,786 960,786 960,416 960,786 240,786 240,260 420,260 420,192",
    // drops straight down from Anti-Cytokine mAb, jogging right through
    // the narrow gap between Bispecific Antibody's and Cell Therapy's
    // labels (x:490-520) to reach CFTR Modulator, then continues straight
    // down the same open column to the two new stations below. Starts at
    // Anti-Cytokine mAb's own dot offset
    respiratory: "460,86 460,100 500,100 500,300 500,500 500,650",
    // Targeted mAb reorder: Infectious Disease is now the topmost dot at
    // y:156, and the top of the pill is now open (Immunology and Oncology
    // both run straight out to the right at their own heights,
    // Cardiovascular passes straight through, Metabolic drops straight
    // down) - so the line runs straight up from its own dot instead of a
    // 45-degree diagonal, then across the open top corridor (y:35, just
    // under Cardiovascular's own y:20 corridor) to its own column. The
    // Targeted mAb badge and station label are shifted off this column
    // (see areaLabelPos.oncology and labelOffsetX["targeted-mab"]) so the
    // straight vertical run has the x:60 column to itself.
    // top run lowered further, y:55 to y:15 - the label text for JAK/
    // Integrin/FcRn Inhibitor (on the blue Immunology line) reaches down
    // to about y:56-70 above their own dots, so y:55 was still crossing
    // the bottom of that text, not just clearing the dots themselves
    "infectious-disease": "60,156 60,15 1450,15 1450,150 1450,350"
  },
  // Every badge is x-centered on the one station that anchors its end of
  // the line (its own unique terminus where possible), placed above or
  // below depending on which side has open space.
  // Positions below are April's own final badge placements from the
  // editable-labels pptx (through v23) - e.g. Oncology's badge moved to
  // sit beside Radioligand Therapy at the line's right end, and Vaccines/
  // Infectious Disease's badge moved down near Direct-Acting Antiviral.
  areaLabelPos: {
    oncology: { x: 1173, y: 182 },
    immunology: { x: 1034, y: 91 },
    "rare-disease": { x: 959, y: 336 },
    metabolic: { x: -80, y: 332 },
    neuro: { x: 1202, y: 333 },
    cardiovascular: { x: 0, y: 858 },
    ophthalmology: { x: 480, y: 930 },
    hematology: { x: 1050, y: 826 },
    respiratory: { x: 500, y: 678 },
    "infectious-disease": { x: 1450, y: 382 }
  },
  stationPos: {
    "targeted-mab": { x: 60, y: 180 },
    // Shifted 6px off the row's own y:180 so Oncology's dot (tone1, the
    // +6 offset) lands exactly on y:180 instead of y:186 - lets Oncology's
    // line run perfectly straight through this pill with zero notch.
    "adc": { x: 220, y: 174 },
    // Shifted the opposite direction (Oncology is tone0 here, the -6
    // offset) for the same reason - its dot also lands exactly on y:180.
    "bispecific-ab": { x: 420, y: 186 },
    "cell-therapy": { x: 600, y: 180 },
    "small-molecule": { x: 780, y: 180 },
    "checkpoint-inhibitor": { x: 960, y: 180 },
    "radioligand-therapy": { x: 1140, y: 180 },
    "anti-cytokine-mab": { x: 460, y: 80 },
    "jak-inhibitor": { x: 220, y: 80 },
    "gene-therapy-aav": { x: 480, y: 780 },
    "enzyme-replacement-therapy": { x: 480, y: 540 },
    "aso": { x: 780, y: 540 },
    // Metabolic's whole GLP-1-to-RNAi row sits at y:414 (SGLT2's own dot
    // offset), not the old y:420 - moved as a block so the entire line is
    // one uniform height with zero transition jogs anywhere, instead of
    // dipping to touch SGLT2's offset dot partway through. SGLT2 itself
    // stays at y:420 since that pill's own two dots are still +-6 from its
    // center regardless of what height lines approach it from.
    "rnai-therapeutics": { x: 780, y: 414 },
    "crispr-gene-editing": { x: 960, y: 420 },
    "glp1-agonist": { x: 60, y: 414 },
    "sglt2-inhibitor": { x: -80, y: 420 },
    "thr-beta-agonist": { x: 420, y: 414 },
    "insulin-analog": { x: 620, y: 414 },
    "integrin-inhibitor": { x: 820, y: 80 },
    "fcrn-inhibitor": { x: 1000, y: 80 },
    "anti-amyloid-mab": { x: 1200, y: 400 },
    "anti-cgrp-therapy": { x: 1200, y: 540 },
    "anticoagulant-doac": { x: 0, y: 780 },
    "arni-heart-failure": { x: 0, y: 700 },
    "complement-inhibitor-ga": { x: 350, y: 830 },
    "anti-vegf-therapy": { x: 480, y: 900 },
    "dry-eye-immunomodulator": { x: 350, y: 900 },
    // Shifted from y:830 to y:786 so Hematology's line runs straight
    // through here with no notch - see the hematology path comment
    "complement-inhibitor-pnh": { x: 1050, y: 786 },
    "cftr-modulator": { x: 500, y: 300 },
    "antifibrotic-ipf": { x: 500, y: 500 },
    "anti-tslp-biologic": { x: 500, y: 650 },
    "mrna-vaccine": { x: 1450, y: 150 },
    "antiviral-daa": { x: 1450, y: 350 }
  },
  // stations sitting where a straight-above label would cross the line -
  // render their label below the dot, or offset sideways, instead
  labelBelow: ["adc", "gene-therapy-aav", "aso", "anticoagulant-doac"],
  // Anti-CGRP Therapy sits right at a T-junction where a line runs
  // straight through above and below it (same x) - shift its label to the
  // open left side instead of the default above-the-dot placement, which
  // would sit right on top of the incoming vertical line
  // same 65px offset magnitude as GLP-1 Receptor Agonist uses to clear its
  // own T-junction's vertical line, mirrored to the left since Anti-CGRP's
  // line runs to its right instead of its left
  // AAV's label is shifted right, off its own x, to leave the space
  // directly below the dot open - that's where Hematology's line now
  // approaches from (the one side not already used by Rare Disease/
  // Neuro/Ophthalmology)
  // anti-vegf-therapy no longer needs an offset now that it's a clean
  // terminus under AAV rather than sitting at Cardiovascular's old T-junction
  // Respiratory's column (x:500) runs vertically through CFTR Modulator,
  // Antifibrotic, and Anti-TSLP - a horizontally-centered label on a
  // vertical line sits right on top of the line's continuing path, so
  // each is shifted sideways off it. Enzyme Replacement Therapy's own
  // label is wide enough to reach across into that same column from its
  // own dot 20px away, so it's shifted the other direction, clear of both
  // Respiratory's line and Hematology's line 85px to its other side.
  // 2026-07-31: overrides below re-derived from April's final hand-placed
  // positions in the editable-labels pptx (through v23) - each value ports
  // her exact on-slide label position back into the live map, replacing
  // the earlier hand-picked pins above.
  labelOffsetX: {
    "targeted-mab": -73,
    "jak-inhibitor": 5,
    "fcrn-inhibitor": 1,
    "gene-therapy-aav": 71,
    "enzyme-replacement-therapy": -97,
    "rnai-therapeutics": 38,
    "crispr-gene-editing": 2,
    "glp1-agonist": 73,
    "sglt2-inhibitor": 4,
    "thr-beta-agonist": -1,
    "anti-cgrp-therapy": 57,
    "arni-heart-failure": -73,
    "anti-vegf-therapy": 58,
    "complement-inhibitor-ga": -114,
    "dry-eye-immunomodulator": -12,
    "cftr-modulator": 80,
    "mrna-vaccine": -74,
    "antiviral-daa": -61,
    "antifibrotic-ipf": 51,
    "anti-tslp-biologic": 54
  },
  // CRISPR's label centered directly under the Rare Disease legend, 50px
  // gap between them (legend y:290, label default would land at y:360 -
  // pulled up by 20 to land at 340)
  labelOffsetY: {
    "targeted-mab": 38,
    "anti-cytokine-mab": 9,
    "jak-inhibitor": 6,
    "integrin-inhibitor": 5,
    "fcrn-inhibitor": -1,
    "gene-therapy-aav": -24,
    "enzyme-replacement-therapy": 48,
    "rnai-therapeutics": 94,
    "crispr-gene-editing": 7,
    "glp1-agonist": 12,
    "sglt2-inhibitor": 4,
    "thr-beta-agonist": -1,
    "anti-amyloid-mab": 12,
    "anti-cgrp-therapy": 36,
    "arni-heart-failure": 38,
    "anti-vegf-therapy": 42,
    "complement-inhibitor-ga": 38,
    "dry-eye-immunomodulator": 69,
    "complement-inhibitor-pnh": -6,
    "cftr-modulator": 25,
    "mrna-vaccine": 23,
    "antiviral-daa": 29,
    "antifibrotic-ipf": 40,
    "anti-tslp-biologic": 32
  },
  // For stations where a real line's connection to its own dot would
  // otherwise be fully hidden under the pill's opaque white fill, redraw
  // that hidden stretch as a dashed line in the matching color so the
  // connection is visible instead of leaving a blank gap. Each entry is
  // {toneIndex, sides} - toneIndex matches the dot's position in that
  // modality's areas array (0-based), sides is which pill edge(s) that
  // line's dashed stretch should reach (a dot a line only terminates at
  // needs one side; a dot a line passes through needs both).
  pillCrossings: {
    "rnai-therapeutics": [
      { toneIndex: 0, sides: ["top"] },    // Cardiovascular enters from above
      { toneIndex: 1, sides: ["left"] },   // Metabolic enters from the left
      { toneIndex: 2, sides: ["left", "right"] } // Rare Disease passes through
    ],
    "sglt2-inhibitor": [
      { toneIndex: 0, sides: ["right"] },  // Metabolic's hairpin approaches from the right
      { toneIndex: 1, sides: ["left"] }    // Cardiovascular's hairpin approaches from the left
    ],
    "targeted-mab": [
      { toneIndex: 0, sides: ["top"] },    // Infectious Disease exits straight up
      { toneIndex: 1, sides: ["right"] },  // Immunology exits straight right
      { toneIndex: 2, sides: ["right"] },  // Oncology exits straight right
      { toneIndex: 3, sides: ["left"] },   // Cardiovascular's hairpin approaches from the left
      { toneIndex: 4, sides: ["bottom"] }  // Metabolic exits straight down
    ],
    "adc": [
      { toneIndex: 0, sides: ["left", "top"] }, // Immunology enters from the left corridor, exits up toward JAK Inhibitor
      { toneIndex: 1, sides: ["left", "right"] } // Oncology passes through
    ],
    "bispecific-ab": [
      { toneIndex: 0, sides: ["left", "right"] }, // Oncology passes through
      { toneIndex: 1, sides: ["bottom"] }  // Hematology enters from below
    ],
    "crispr-gene-editing": [
      { toneIndex: 0, sides: ["left"] },   // Rare Disease enters from the left
      { toneIndex: 1, sides: ["bottom"] }  // Hematology's hairpin approaches from below
    ],
    "aso": [
      { toneIndex: 0, sides: ["left", "right"] }, // Rare Disease passes through
      { toneIndex: 1, sides: ["right"] }   // Neuro's hairpin approaches from the right
    ],
    "gene-therapy-aav": [
      { toneIndex: 0, sides: ["top"] },    // Rare Disease exits straight up (terminus)
      { toneIndex: 1, sides: ["right"] },  // Neuro enters from the right (terminus)
      { toneIndex: 2, sides: ["left", "right"] }, // Hematology passes straight through, same height as its own trunk
      { toneIndex: 3, sides: ["left", "bottom"] } // Ophthalmology turns here: in from the left, out the bottom
    ]
  }
  // interchange dot colors are now read directly from each modality's own
  // "areas" list in content.json (see buildMap) rather than a hand-
  // maintained cap-at-2 list here, so stations shared by 3+ lines show
  // every color instead of only the first two
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
//
// A rounded corner always "cuts the corner" short of the true vertex - for
// a normal turn by about radius*0.4, for a full U-turn spike by about
// radius/2. When that vertex is a station's exact position, the cut can
// leave a visible gap between the line and the station dot. So corners
// that land exactly on a station (per stationPoints) use a much smaller
// radius - just enough to stay smooth while guaranteeing the curve still
// reaches into the dot - while pure routing bends keep the full radius.
function roundedPathD(points, radius, stationPoints) {
  if (points.length < 2) return "";
  var STATION_CORNER_RADIUS = 6;
  var d = "M " + points[0].x + " " + points[0].y + " ";
  for (var i = 1; i < points.length - 1; i++) {
    var prev = points[i - 1];
    var curr = points[i];
    var next = points[i + 1];

    var d1x = curr.x - prev.x, d1y = curr.y - prev.y;
    var len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    var d2x = next.x - curr.x, d2y = next.y - curr.y;
    var len2 = Math.sqrt(d2x * d2x + d2y * d2y);

    var isStation = stationPoints && stationPoints[curr.x + "," + curr.y];
    var effRadius = isStation ? Math.min(radius, STATION_CORNER_RADIUS) : radius;
    var r = Math.min(effRadius, len1 / 2, len2 / 2);

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

// Every station's {x,y} as a "x,y" lookup set, used by roundedPathD to
// know which path vertices are real stations vs. pure routing bends.
function buildStationPointSet() {
  var set = {};
  Object.keys(LAYOUT.stationPos).forEach(function (id) {
    var p = LAYOUT.stationPos[id];
    set[p.x + "," + p.y] = true;
  });
  return set;
}

var CORNER_RADIUS = 20;

function buildMap(app) {
  var svg = svgEl("svg", { id: "subway-map", viewBox: LAYOUT.viewBox });

  var vbParts = LAYOUT.viewBox.split(" ");
  svg.appendChild(svgEl("rect", {
    x: vbParts[0], y: vbParts[1], width: vbParts[2], height: vbParts[3],
    fill: "#fdfdfb", class: "map-background"
  }));

  var stationPoints = buildStationPointSet();

  state.data.areas.forEach(function (area) {
    var path = LAYOUT.linePaths[area.id];
    if (!path) return;
    var pts = parsePoints(path);
    var line = svgEl("path", {
      d: roundedPathD(pts, CORNER_RADIUS, stationPoints),
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

  // Only the small color badge + abbreviation appears inline on each
  // line now (no more full spelled-out name floating on the map) - the
  // full name mapping lives in the single corner legend box instead
  // (see renderMapLegendBox below).
  state.data.areas.forEach(function (area) {
    var pos = LAYOUT.areaLabelPos[area.id];
    if (!pos) return;

    var badge = svgEl("circle", {
      cx: pos.x,
      cy: pos.y - 6,
      // widened from 11 to 16 - at 11 the bold 2-letter abbreviation text
      // reached (or slightly passed) the circle's own edge
      r: 16,
      fill: area.color,
      class: "area-badge",
      "data-area": area.id
    });
    badge.addEventListener("click", function () {
      selectArea(area.id);
    });
    svg.appendChild(badge);

    var badgeText = svgEl("text", {
      x: pos.x,
      y: pos.y - 1,
      "text-anchor": "middle",
      class: "area-badge-text",
      "data-area": area.id
    });
    badgeText.textContent = area.abbr || area.name.slice(0, 2).toUpperCase();
    badgeText.addEventListener("click", function () {
      selectArea(area.id);
    });
    svg.appendChild(badgeText);
  });

  state.data.modalities.forEach(function (mod) {
    var pos = LAYOUT.stationPos[mod.id];
    if (!pos) return;
    var isInterchange = mod.areas.length > 1;
    var primaryArea = state.data.areas.filter(function (a) {
      return a.id === mod.areas[0];
    })[0];
    var primaryColor = primaryArea ? primaryArea.color : "#333";

    // Stations shared by N lines get a rounded-pill marker sized to hold
    // all N color dots (one per sharing line, in content.json's areas
    // order) with a visible gap to the border - like the NYC subway map's
    // interchange markers - instead of a plain circle that only reads as
    // one line. The pill grows taller as N grows so the dots never crowd.
    var shareCount = mod.areas.length;
    var multiTone = shareCount > 1;
    var dotSpacing = 12;
    var pillW = 20, pillH = 24 + (shareCount - 1) * dotSpacing;
    var dot;
    if (multiTone) {
      dot = svgEl("rect", {
        x: pos.x - pillW / 2,
        y: pos.y - pillH / 2,
        width: pillW,
        height: pillH,
        rx: 10,
        class: "station-dot hidden-station interchange-dot square-dot",
        fill: "#fff",
        stroke: "#111",
        "stroke-width": 4,
        "data-station": mod.id
      });
    } else {
      dot = svgEl("circle", {
        cx: pos.x,
        cy: pos.y,
        r: isInterchange ? 11 : 6,
        class: "station-dot hidden-station" + (isInterchange ? " interchange-dot" : ""),
        fill: "#fff",
        stroke: isInterchange ? "#111" : primaryColor,
        "stroke-width": isInterchange ? 4 : 3,
        "data-station": mod.id
      });
    }
    dot.addEventListener("click", function (e) {
      e.stopPropagation();
      selectStation(mod.id);
    });
    svg.appendChild(dot);

    // One small color dot per sharing line, stacked vertically in areas
    // order, marking exactly which lines meet at this station - like the
    // NYC map's interchange color indicators.
    if (multiTone) {
      var toneColors = mod.areas.map(function (areaId) {
        var a = state.data.areas.filter(function (ar) { return ar.id === areaId; })[0];
        return a ? a.color : "#333";
      });
      var toneStart = -((shareCount - 1) / 2) * dotSpacing;

      // The pill's opaque white fill hides the real colored line for the
      // stretch between the pill's border and each dot, leaving a blank
      // gap - a rounded corner never actually reaches its own vertex
      // either, so tightening it can't close that gap (see the RNAi
      // Therapeutics fix history above). Instead of a blank gap, redraw
      // that hidden stretch as a dashed line in the same color, on top of
      // the white fill, so the connection from border to dot (and through
      // to the opposite border, for lines that pass all the way through)
      // is visible rather than implied.
      var crossings = LAYOUT.pillCrossings && LAYOUT.pillCrossings[mod.id];
      if (crossings) {
        // inset 2px from the raw rect edge (half the border's 4px stroke
        // width) so the dashes stay inside the white fill and don't draw
        // on top of / interrupt the black border itself
        var pillLeft = pos.x - pillW / 2 + 2;
        var pillRight = pos.x + pillW / 2 - 2;
        var pillTop = pos.y - pillH / 2 + 2;
        var pillBottom = pos.y + pillH / 2 - 2;
        crossings.forEach(function (c) {
          var dotY = pos.y + toneStart + c.toneIndex * dotSpacing;
          var color = toneColors[c.toneIndex];
          (c.sides || []).forEach(function (side) {
            var x1 = pos.x, y1 = dotY, x2 = pos.x, y2 = dotY;
            if (side === "left") { x1 = pillLeft; }
            else if (side === "right") { x2 = pillRight; }
            else if (side === "top") { y1 = pillTop; }
            else if (side === "bottom") { y2 = pillBottom; }
            svg.appendChild(svgEl("line", {
              x1: x1, y1: y1, x2: x2, y2: y2,
              stroke: color, "stroke-width": 2, "stroke-dasharray": "1.5,1.5",
              "stroke-linecap": "butt",
              class: "pill-crossing hidden-station",
              "data-station-tone": mod.id
            }));
          });
        });
      }

      toneColors.forEach(function (color, ti) {
        var toneDot = svgEl("circle", {
          cx: pos.x,
          cy: pos.y + toneStart + ti * dotSpacing,
          r: 3.5,
          fill: color,
          class: "tone-dot hidden-station",
          "data-station-tone": mod.id
        });
        svg.appendChild(toneDot);
      });
    }

    var lines = wrapLabel(mod.name);
    var labelBelow = LAYOUT.labelBelow && LAYOUT.labelBelow.indexOf(mod.id) !== -1;
    // multiTone markers grow taller with more sharing lines, so labels
    // placed below them need clearance that scales with the actual pill
    // height rather than a fixed constant.
    var haloHalf = multiTone ? pillH / 2 : (isInterchange ? 11 : 6);
    // Clearance now scales with the marker's actual size on BOTH sides
    // (above and below) instead of only the below-branch scaling with
    // pillH - large multi-tone pills (like Targeted mAb's 5-dot pill) were
    // getting a label placed using the same fixed offset as a tiny plain
    // dot, so the label sat inside the pill itself.
    var clearance = haloHalf + (lines.length > 1 ? 16 : 8);
    // For "below" placement, line 0 (the nearest to the dot) sits right at
    // the clearance gap, with any additional lines stacking further away.
    // For "above" placement, lines still stack top-to-bottom in reading
    // order, so the line NEAREST the dot is the LAST one - shift the whole
    // block up by the extra stacked lines so that last line, not line 0,
    // is the one sitting at the clearance gap. Otherwise multi-line labels
    // placed above ended up much closer to the dot than the same label
    // would sit if placed below (e.g. ARNI above its dot vs. DOAC below).
    var baseY = labelBelow
      ? pos.y + clearance
      : pos.y - clearance - (lines.length - 1) * 15;
    baseY += (LAYOUT.labelOffsetY && LAYOUT.labelOffsetY[mod.id]) || 0;
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

  renderMapLegendBox(svg);

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

// Single consolidated legend box (bottom-left, like a real transit map's
// corner legend) mapping every abbreviation shown on the map to its full
// area name - since the map itself now only shows abbreviations inline.
var MAP_LEGEND_BOX = { x: 1480, y: 880, w: 400, h: 130 };
function renderMapLegendBox(svg) {
  var box = MAP_LEGEND_BOX;
  svg.appendChild(svgEl("rect", {
    x: box.x, y: box.y, width: box.w, height: box.h,
    rx: 8, fill: "#fdfdfb", stroke: "#111", "stroke-width": 2,
    class: "legend-box"
  }));
  svg.appendChild(svgEl("text", {
    x: box.x + 10, y: box.y + 14,
    class: "legend-box-title"
  })).textContent = "Lines";

  var padding = 10;
  var colW = (box.w - padding * 2) / 2;
  var rowH = 18;
  var rowsStartY = box.y + 32;
  state.data.areas.forEach(function (area, i) {
    var col = i < 5 ? 0 : 1;
    var row = i % 5;
    var cx = box.x + padding + 8 + col * colW;
    var cy = rowsStartY + row * rowH;
    var swatch = svgEl("circle", {
      cx: cx, cy: cy, r: 7,
      fill: area.color,
      class: "legend-box-swatch",
      "data-area": area.id
    });
    swatch.addEventListener("click", function () { selectArea(area.id); });
    svg.appendChild(swatch);

    var swatchText = svgEl("text", {
      x: cx, y: cy + 3,
      "text-anchor": "middle",
      class: "legend-box-swatch-text",
      "data-area": area.id
    });
    swatchText.textContent = area.abbr || "";
    svg.appendChild(swatchText);

    var nameText = svgEl("text", {
      x: cx + 13, y: cy + 3,
      class: "legend-box-name",
      "data-area": area.id
    });
    nameText.textContent = area.name;
    nameText.addEventListener("click", function () { selectArea(area.id); });
    svg.appendChild(nameText);
  });
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
    var tones = svg.querySelectorAll('[data-station-tone="' + mod.id + '"]');

    var isSelected = mod.id === state.selectedStation;

    if (dot) dot.classList.toggle("hidden-station", !belongsToSelected);
    labels.forEach(function (el) {
      el.classList.toggle("hidden-station", !belongsToSelected);
      el.classList.toggle("selected", isSelected);
    });
    if (sub) sub.classList.toggle("hidden-station", !belongsToSelected);
    tones.forEach(function (el) {
      el.classList.toggle("hidden-station", !belongsToSelected);
    });

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
