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
