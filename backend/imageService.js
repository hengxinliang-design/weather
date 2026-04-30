const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
const GENERATED_DIR = path.join(__dirname, "..", "public", "generated");
const PUBLIC_GENERATED_PATH = "/generated";
const OPENAI_ALLOWED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536", "auto"]);
const DEFAULT_SOURCE_SIZE = "1536x1024";
const DEFAULT_OUTPUT_SIZE = "3840x2160";

function buildScenePrompt(weather, festival, prompt) {
  const location = [weather.city, weather.country].filter(Boolean).join(", ");
  const festivalLine = festival && festival.active ? `Include a subtle ${festival.name} overlay using ${festival.motif} motifs.` : "";

  return [
    "Generate an isometric weather scene for a modern H5 weather dashboard.",
    `Location: ${location}.`,
    `Weather: ${weather.temperature} degrees, ${weather.description || weather.condition}, humidity ${weather.humidity}%, cloud cover ${weather.cloudCover}%.`,
    `Visual mood: ${weather.visual.mood}, ${weather.visual.gradient} atmosphere, accent ${weather.visual.accent}.`,
    weather.season ? `Season control: ${weather.season.season}, ${weather.season.prompt}, color grade ${weather.season.colorGrade}, palette ${weather.season.palette.join(", ")}.` : "",
    festivalLine,
    `UI prompt context: ${prompt.visualPrompt}`,
    "Style: polished isometric miniature city block, clean lighting, no text, no logos, no UI chrome, centered composition, app-ready background art."
  ]
    .filter(Boolean)
    .join(" ");
}

async function getOrCreateScene(weather, festival, prompt) {
  const scenePrompt = buildScenePrompt(weather, festival, prompt);
  const imageConfig = getImageConfig();
  const cacheKey = crypto.createHash("sha256").update(`${scenePrompt}|${JSON.stringify(imageConfig)}`).digest("hex").slice(0, 24);
  const filename = `${cacheKey}.png`;
  const filePath = path.join(GENERATED_DIR, filename);
  const publicPath = `${PUBLIC_GENERATED_PATH}/${filename}`;

  await fs.mkdir(GENERATED_DIR, { recursive: true });

  if (await fileExists(filePath)) {
    return {
      cached: true,
      path: publicPath,
      prompt: scenePrompt,
      ...imageConfig
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      cached: false,
      path: "",
      prompt: scenePrompt,
      ...imageConfig,
      error: "Missing OPENAI_API_KEY. Add it to .env to enable automatic scene generation."
    };
  }

  let imageBase64;
  try {
    imageBase64 = await generateOpenAIImage(scenePrompt, imageConfig);
  } catch (error) {
    if (isBillingLimitError(error)) {
      return {
        cached: false,
        path: "",
        prompt: scenePrompt,
        type: "keywords",
        fallbackReason: "billing_limit",
        keywordScene: buildKeywordScene(weather, festival),
        ...imageConfig
      };
    }

    return {
      cached: false,
      path: "",
      prompt: scenePrompt,
      ...imageConfig,
      error: error.message || "OpenAI image generation failed."
    };
  }

  await writeUpscaledImage(Buffer.from(imageBase64, "base64"), filePath, imageConfig.output);

  return {
    cached: false,
    path: publicPath,
    prompt: scenePrompt,
    ...imageConfig
  };
}

async function generateOpenAIImage(prompt, imageConfig = getImageConfig()) {
  const response = await fetch(OPENAI_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: imageConfig.model,
      prompt,
      size: imageConfig.source.size,
      quality: imageConfig.quality,
      n: 1
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload.error && payload.error.message ? payload.error.message : "OpenAI image generation failed.";
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const image = payload.data && payload.data[0];
  if (!image || !image.b64_json) {
    throw new Error("OpenAI image response did not include base64 image data.");
  }

  return image.b64_json;
}

function isBillingLimitError(error) {
  return /billing hard limit has been reached/i.test(error && error.message ? error.message : "");
}

function buildKeywordScene(weather, festival) {
  const location = [weather.city, weather.country].filter(Boolean).join(", ");
  const season = weather.season ? weather.season.season : "";
  const tone = weather.visual && weather.visual.tone ? weather.visual.tone : weather.season && weather.season.tone;
  const keywords = [
    location,
    weather.condition,
    weather.scene || weather.description,
    weather.sunPhase,
    season,
    tone,
    `${weather.temperature}${weather.units === "imperial" ? "F" : "C"}`,
    `${weather.humidity}% humidity`,
    `${weather.cloudCover}% cloud cover`
  ].filter(Boolean);
  const highlights = [
    { label: "Mood", value: weather.visual ? weather.visual.mood : weather.condition },
    { label: "Light", value: weather.sunLighting },
    { label: "Motion", value: weather.visual ? weather.visual.motion : "ambient" },
    { label: "Local", value: weather.localTime ? `${weather.localTime} local` : weather.timezone || "local time" }
  ];

  if (festival && festival.active) {
    keywords.push(festival.name, `${festival.motif} motif`);
  }

  return {
    title: `${location || "City"} weather profile`,
    subtitle: `${weather.condition} / ${weather.scene || weather.description}`,
    accent: weather.visual ? weather.visual.accent : "#0f766e",
    keywords,
    highlights,
    palette: weather.visual && weather.visual.palette ? weather.visual.palette : []
  };
}

function getImageConfig() {
  const requestedSourceSize = process.env.OPENAI_IMAGE_SIZE || DEFAULT_SOURCE_SIZE;
  const sourceSize = OPENAI_ALLOWED_SIZES.has(requestedSourceSize) ? requestedSourceSize : DEFAULT_SOURCE_SIZE;
  const outputSize = parseSize(process.env.SCENE_OUTPUT_SIZE || DEFAULT_OUTPUT_SIZE, DEFAULT_OUTPUT_SIZE);

  return {
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    quality: process.env.OPENAI_IMAGE_QUALITY || "high",
    source: {
      size: sourceSize,
      native4k: false
    },
    output: {
      width: outputSize.width,
      height: outputSize.height,
      size: `${outputSize.width}x${outputSize.height}`,
      format: "png",
      resize: "cover"
    }
  };
}

function parseSize(value, fallback) {
  const match = /^(\d{3,5})x(\d{3,5})$/.exec(value || "");
  if (!match) {
    return parseSize(fallback);
  }

  return {
    width: Number(match[1]),
    height: Number(match[2])
  };
}

async function writeUpscaledImage(inputBuffer, filePath, output) {
  await sharp(inputBuffer)
    .resize(output.width, output.height, {
      fit: output.resize,
      position: "center",
      kernel: sharp.kernel.lanczos3
    })
    .png({
      compressionLevel: 8,
      adaptiveFiltering: true
    })
    .toFile(filePath);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  buildKeywordScene,
  buildScenePrompt,
  generateOpenAIImage,
  getImageConfig,
  getOrCreateScene,
  isBillingLimitError,
  parseSize,
  writeUpscaledImage
};
