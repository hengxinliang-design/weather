const test = require("node:test");
const assert = require("node:assert/strict");
const mapWeatherVisual = require("../backend/weatherVisualMap");

test("maps Open-Meteo weather code to visual weather", () => {
  assert.deepEqual(mapWeatherVisual(65), {
    condition: "Heavy Rain",
    scene: "heavy rain storm",
    visual: "dense rain dramatic wet lighting"
  });
});

test("falls back to clear weather for unknown code", () => {
  assert.deepEqual(mapWeatherVisual(999), {
    condition: "Clear",
    scene: "clear sky",
    visual: "bright sunlight soft shadow"
  });
});
