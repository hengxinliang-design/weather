const test = require("node:test");
const assert = require("node:assert/strict");
const mapSunLighting = require("../backend/sunLightingEngine");

test("maps solar elevation to lighting phase", () => {
  assert.deepEqual(mapSunLighting(31), {
    phase: "midday",
    lighting: "strong overhead sunlight crisp shadow"
  });

  assert.deepEqual(mapSunLighting(-8), {
    phase: "twilight",
    lighting: "blue hour soft ambient lighting"
  });
});
