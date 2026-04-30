const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const sharp = require("sharp");
const imageService = require("../backend/imageService");

test("uses high quality source image and 4K output defaults", () => {
  const originalEnv = snapshotEnv();
  delete process.env.OPENAI_IMAGE_SIZE;
  delete process.env.OPENAI_IMAGE_QUALITY;
  delete process.env.SCENE_OUTPUT_SIZE;

  const config = imageService.getImageConfig();

  restoreEnv(originalEnv);
  assert.equal(config.source.size, "1536x1024");
  assert.equal(config.quality, "high");
  assert.equal(config.output.size, "3840x2160");
  assert.equal(config.output.format, "png");
});

test("falls back from unsupported OpenAI source size but keeps requested output size", () => {
  const originalEnv = snapshotEnv();
  process.env.OPENAI_IMAGE_SIZE = "3840x2160";
  process.env.SCENE_OUTPUT_SIZE = "4096x2304";

  const config = imageService.getImageConfig();

  restoreEnv(originalEnv);
  assert.equal(config.source.size, "1536x1024");
  assert.equal(config.output.size, "4096x2304");
});

test("writes generated image as requested 4K dimensions", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "weather-scene-"));
  const source = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: "#0f766e"
    }
  })
    .png()
    .toBuffer();
  const target = path.join(dir, "scene.png");

  await imageService.writeUpscaledImage(source, target, {
    width: 3840,
    height: 2160,
    resize: "cover"
  });

  const metadata = await sharp(target).metadata();
  assert.equal(metadata.width, 3840);
  assert.equal(metadata.height, 2160);
});

test("detects OpenAI billing hard limit errors", () => {
  assert.equal(imageService.isBillingLimitError(new Error("Billing hard limit has been reached.")), true);
  assert.equal(imageService.isBillingLimitError(new Error("OpenAI image generation failed.")), false);
});

test("builds keyword scene fallback from weather context", () => {
  const keywordScene = imageService.buildKeywordScene(
    {
      city: "Detroit",
      country: "US",
      condition: "Rain",
      scene: "light rain",
      temperature: 58,
      units: "imperial",
      humidity: 77,
      cloudCover: 92,
      sunPhase: "afternoon",
      sunLighting: "soft diffused daylight",
      localTime: "14:20",
      visual: {
        mood: "rain",
        motion: "fall",
        accent: "#2563eb",
        tone: "fresh green bloom",
        palette: ["#2563eb"]
      },
      season: {
        season: "spring",
        tone: "fresh green bloom"
      }
    },
    {
      active: true,
      name: "Spring Mode",
      motif: "leaf"
    }
  );

  assert.equal(keywordScene.title, "Detroit, US weather profile");
  assert.equal(keywordScene.keywords.length, 4);
  assert.deepEqual(Object.keys(keywordScene.keywords[0]), ["en", "zh", "description"]);
  assert.equal(keywordScene.keywords[0].en, "Rain");
  assert.equal(keywordScene.keywords[0].zh, "降雨");
  assert.equal(keywordScene.keywords[2].en, "Spring Mode");
  assert.equal(keywordScene.keywords[2].zh, "春日模式");
  assert.match(keywordScene.keywords[3].description, /Humidity is 77%/);
  assert.equal(keywordScene.highlights[0].label, "Mood");
  assert.equal(keywordScene.highlights[0].value, "rain");
});

function snapshotEnv() {
  return {
    OPENAI_IMAGE_SIZE: process.env.OPENAI_IMAGE_SIZE,
    OPENAI_IMAGE_QUALITY: process.env.OPENAI_IMAGE_QUALITY,
    SCENE_OUTPUT_SIZE: process.env.SCENE_OUTPUT_SIZE
  };
}

function restoreEnv(env) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
