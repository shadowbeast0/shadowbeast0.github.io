const OPEN = [
  [50, 95],
  [37, 87], [28, 78], [21, 69], [15, 61],
  [39, 58], [37, 42], [36, 32], [35, 22],
  [50, 56], [50, 39], [50, 28], [50, 17],
  [61, 58], [63, 42], [64, 32], [65, 23],
  [71, 63], [75, 51], [77, 43], [79, 35],
];

const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
const FINGERS = { index: 5, middle: 9, ring: 13, pinky: 17 };

const curl = (p, base) => {
  const [mx, my] = p[base];
  p[base + 1] = [mx + 1, my - 9];
  p[base + 2] = [mx + 3, my - 5];
  p[base + 3] = [mx + 3, my];
};
const tuck = (p) => {
  p[2] = [33, 79];
  p[3] = [40, 73];
  p[4] = [46, 69];
};

function pose(spec) {
  const p = OPEN.map((q) => q.slice());
  for (const [name, base] of Object.entries(FINGERS)) if (!spec.up.includes(name)) curl(p, base);
  if (spec.thumb === "tuck") tuck(p);
  if (spec.thumb === "up") { p[2] = [33, 66]; p[3] = [31, 52]; p[4] = [30, 39]; }
  if (spec.thumb === "side") { p[2] = [26, 82]; p[3] = [17, 78]; p[4] = [9, 74]; }
  if (spec.pinch) { p[6] = [37, 46]; p[7] = [33, 45]; p[8] = [29, 50]; p[3] = [24, 60]; p[4] = [28, 52]; }
  if (spec.vee) { p[6] = [34, 42]; p[7] = [31, 32]; p[8] = [28, 22]; p[10] = [53, 39]; p[11] = [55, 28]; p[12] = [57, 18]; }
  return p;
}

export const SIGNS = [
  pose({ up: ["pinky"], thumb: "side" }),
  pose({ up: [], thumb: "tuck" }),
  pose({ up: ["index", "middle", "ring", "pinky"], thumb: "open" }),
  pose({ up: ["index", "middle"], thumb: "tuck", vee: true }),
  pose({ up: ["index", "middle", "ring"], thumb: "tuck" }),
  pose({ up: ["index", "pinky"], thumb: "tuck" }),
  pose({ up: [], thumb: "up" }),
  pose({ up: ["index"], thumb: "open", pinch: true }),
  pose({ up: ["index", "middle", "ring", "pinky"], thumb: "tuck" }),
  pose({ up: ["index"], thumb: "tuck" }),
  pose({ up: ["index"], thumb: "side" }),
  pose({ up: ["index", "middle", "ring", "pinky"], thumb: "open", pinch: true }),
];

export function signSVG(id, size = 30) {
  const p = SIGNS[id];
  const tips = new Set([4, 8, 12, 16, 20]);
  const lines = BONES.map(([a, b]) => `<line x1="${p[a][0]}" y1="${p[a][1]}" x2="${p[b][0]}" y2="${p[b][1]}"/>`).join("");
  const dots = p.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${tips.has(i) ? 4.2 : i === 0 ? 3.6 : 2.6}"${tips.has(i) ? ' class="tip"' : ""}/>`).join("");
  return `<svg class="sign" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g class="sign__bones">${lines}</g><g class="sign__joints">${dots}</g></svg>`;
}
