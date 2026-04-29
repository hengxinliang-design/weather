const test = require("node:test");
const assert = require("node:assert/strict");
const seasonEngine = require("../backend/seasonEngine");

test("maps months to season tone controls", () => {
  assert.equal(seasonEngine.mapSeason(4).season, "spring");
  assert.equal(seasonEngine.mapSeason(7).season, "summer");
  assert.equal(seasonEngine.mapSeason(10).season, "autumn");
  assert.equal(seasonEngine.mapSeason(1).season, "winter");
});

test("season control includes palette and prompt language", () => {
  const autumn = seasonEngine.mapSeason(10);

  assert.equal(autumn.tone, "amber leaf warmth");
  assert.ok(autumn.palette.includes("#c76f3a"));
  assert.match(autumn.prompt, /autumn palette/);
  assert.match(autumn.colorGrade, /amber highlights/);
});
