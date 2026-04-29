const test = require("node:test");
const assert = require("node:assert/strict");
const festivalService = require("../backend/festivalService");

test("returns fixed festival overlay when date matches", () => {
  const overlay = festivalService.getFestivalOverlay(new Date("2026-12-25T12:00:00Z"), { city: "Detroit" });

  assert.equal(overlay.active, true);
  assert.equal(overlay.name, "Christmas Day");
  assert.equal(overlay.theme, "winter");
  assert.equal(overlay.motif, "snow");
  assert.equal(overlay.headline, "Christmas Day in Detroit");
});

test("returns seasonal overlay when no fixed festival matches", () => {
  const overlay = festivalService.getFestivalOverlay(new Date("2026-04-29T12:00:00Z"), { city: "Detroit" });

  assert.equal(overlay.active, true);
  assert.equal(overlay.name, "Spring Mode");
  assert.equal(overlay.theme, "spring");
  assert.equal(overlay.motif, "leaf");
});
