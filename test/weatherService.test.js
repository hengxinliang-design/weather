const test = require("node:test");
const assert = require("node:assert/strict");
const weatherService = require("../backend/weatherService");

test("calculates solar elevation within physical bounds", () => {
  const elevation = weatherService.calculateSolarElevation(42.3314, -83.0458, "2026-06-21T12:00", -14400);

  assert.equal(typeof elevation, "number");
  assert.ok(elevation >= -90);
  assert.ok(elevation <= 90);
});

test("extracts local month from Open-Meteo local timestamp", () => {
  assert.equal(weatherService.getLocalMonth("2026-10-15T08:00"), 10);
});

test("uses unit-aware heat threshold for visual model", () => {
  const visualWeather = {
    condition: "Clear",
    scene: "clear sky",
    visual: "bright sunlight soft shadow"
  };
  const sunLighting = {
    phase: "midday",
    lighting: "strong overhead sunlight crisp shadow"
  };
  const season = {
    season: "spring",
    tone: "fresh green bloom",
    palette: ["#6cad5f"],
    colorGrade: "soft green highlights"
  };

  assert.equal(weatherService.buildVisualModel(visualWeather, sunLighting, season, 47, 0, "imperial").mood, "clear");
  assert.equal(weatherService.buildVisualModel(visualWeather, sunLighting, season, 90, 0, "imperial").mood, "heat");
  assert.equal(weatherService.buildVisualModel(visualWeather, sunLighting, season, 31, 0, "metric").mood, "heat");
});
