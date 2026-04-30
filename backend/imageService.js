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
  const keywords = [
    {
      en: weather.condition,
      zh: translateWeatherCondition(weather.condition),
      description: `Today's sky in ${location || "this city"} is ${String(weather.scene || weather.description || weather.condition).toLowerCase()}.`
    },
    {
      en: weather.sunPhase || "Local light",
      zh: translateSunPhase(weather.sunPhase),
      description: `The light feels ${String(weather.sunLighting || "soft and local").toLowerCase()}.`
    },
    {
      en: weather.season ? weather.season.season : "Season",
      zh: translateSeason(weather.season ? weather.season.season : ""),
      description: `The seasonal tone is ${String((weather.visual && weather.visual.tone) || (weather.season && weather.season.tone) || "balanced").toLowerCase()}.`
    },
    {
      en: "Humidity",
      zh: "湿度",
      description: `Humidity is ${weather.humidity}% with ${weather.cloudCover}% cloud cover.`
    }
  ];
  const highlights = [
    { label: "Mood", value: weather.visual ? weather.visual.mood : weather.condition },
    { label: "Light", value: weather.sunLighting },
    { label: "Motion", value: weather.visual ? weather.visual.motion : "ambient" },
    { label: "Local", value: weather.localTime ? `${weather.localTime} local` : weather.timezone || "local time" }
  ];

  if (festival && festival.active) {
    keywords[2] = {
      en: festival.name,
      zh: translateFestival(festival.name),
      description: `A subtle ${festival.motif} motif matches the city weather.`
    };
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

function translateWeatherCondition(condition = "") {
  const normalized = condition.toLowerCase();
  if (normalized.includes("thunder")) return "雷暴";
  if (normalized.includes("rain")) return "降雨";
  if (normalized.includes("snow")) return "降雪";
  if (normalized.includes("fog")) return "雾";
  if (normalized.includes("cloud") || normalized.includes("overcast")) return "多云";
  if (normalized.includes("clear")) return "晴朗";
  return "天气";
}

function translateSunPhase(phase = "") {
  const normalized = phase.toLowerCase();
  if (normalized.includes("night")) return "夜间光线";
  if (normalized.includes("sunrise")) return "日出光线";
  if (normalized.includes("sunset")) return "日落光线";
  if (normalized.includes("morning")) return "晨间光线";
  if (normalized.includes("afternoon")) return "午后光线";
  if (normalized.includes("midday")) return "正午光线";
  return "本地光线";
}

function translateSeason(season = "") {
  const normalized = season.toLowerCase();
  if (normalized.includes("spring")) return "春季";
  if (normalized.includes("summer")) return "夏季";
  if (normalized.includes("autumn") || normalized.includes("fall")) return "秋季";
  if (normalized.includes("winter")) return "冬季";
  return "季节";
}

function translateFestival(name = "") {
  const normalized = name.toLowerCase();
  if (normalized.includes("spring")) return "春日模式";
  if (normalized.includes("summer")) return "夏日模式";
  if (normalized.includes("autumn")) return "秋日模式";
  if (normalized.includes("winter")) return "冬日模式";
  if (normalized.includes("christmas")) return "圣诞节";
  if (normalized.includes("new year")) return "新年";
  if (normalized.includes("valentine")) return "情人节";
  if (normalized.includes("halloween")) return "万圣节";
  return "节日";
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
