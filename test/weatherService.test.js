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
