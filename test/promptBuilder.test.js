const test = require("node:test");
const assert = require("node:assert/strict");
const promptBuilder = require("../backend/promptBuilder");

test("builds structured weather prompt", () => {
  const prompt = promptBuilder.buildWeatherPrompt(
    {
      city: "Detroit",
      country: "US",
      temperature: 18,
      feelsLike: 17,
      humidity: 52,
      windSpeed: 3.8,
      condition: "Clear",
      description: "clear sky",
      scene: "clear sky",
      sunLighting: "strong overhead sunlight crisp shadow",
      weatherLighting: "bright sunlight soft shadow",
      localTime: "14:30",
      visual: {
        mood: "clear",
        gradient: "clear",
        accent: "#0f766e",
        motion: "glow"
      }
    },
    {
      active: true,
      name: "Spring Mode",
      motif: "leaf"
    },
    "metric"
  );

  assert.equal(prompt.summary, "Detroit, US Clear 18°");
  assert.match(prompt.details, /clear sky/);
  assert.match(prompt.details, /strong overhead sunlight crisp shadow/);
  assert.match(prompt.visualPrompt, /45° isometric miniature city scene/);
  assert.match(prompt.visualPrompt, /PBR materials/);
  assert.match(prompt.visualPrompt, /Spring Mode/);
  assert.equal(prompt.displayLine, "Clear visual engine / Spring Mode / 14:30 local");
});
