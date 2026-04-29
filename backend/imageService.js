const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
const GENERATED_DIR = path.join(__dirname, "..", "public", "generated");
const PUBLIC_GENERATED_PATH = "/generated";

function buildScenePrompt(weather, festival, prompt) {
  const location = [weather.city, weather.country].filter(Boolean).join(", ");
  const festivalLine = festival && festival.active ? `Include a subtle ${festival.name} overlay using ${festival.motif} motifs.` : "";

  return [
    "Generate an isometric weather scene for a modern H5 weather dashboard.",
    `Location: ${location}.`,
    `Weather: ${weather.temperature} degrees, ${weather.description || weather.condition}, humidity ${weather.humidity}%, cloud cover ${weather.cloudCover}%.`,
    `Visual mood: ${weather.visual.mood}, ${weather.visual.gradient} atmosphere, accent ${weather.visual.accent}.`,
    festivalLine,
    `UI prompt context: ${prompt.visualPrompt}`,
    "Style: polished isometric miniature city block, clean lighting, no text, no logos, no UI chrome, centered composition, app-ready background art."
  ]
    .filter(Boolean)
    .join(" ");
}

async function getOrCreateScene(weather, festival, prompt) {
  const scenePrompt = buildScenePrompt(weather, festival, prompt);
  const cacheKey = crypto.createHash("sha256").update(scenePrompt).digest("hex").slice(0, 24);
  const filename = `${cacheKey}.png`;
  const filePath = path.join(GENERATED_DIR, filename);
  const publicPath = `${PUBLIC_GENERATED_PATH}/${filename}`;

  await fs.mkdir(GENERATED_DIR, { recursive: true });

  if (await fileExists(filePath)) {
    return {
      cached: true,
      path: publicPath,
      prompt: scenePrompt
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      cached: false,
      path: "",
      prompt: scenePrompt,
      error: "Missing OPENAI_API_KEY. Add it to .env to enable automatic scene generation."
    };
  }

  let imageBase64;
  try {
    imageBase64 = await generateOpenAIImage(scenePrompt);
  } catch (error) {
    return {
      cached: false,
      path: "",
      prompt: scenePrompt,
      error: error.message || "OpenAI image generation failed."
    };
  }

  await fs.writeFile(filePath, Buffer.from(imageBase64, "base64"));

  return {
    cached: false,
    path: publicPath,
    prompt: scenePrompt
  };
}

async function generateOpenAIImage(prompt) {
  const response = await fetch(OPENAI_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
      quality: process.env.OPENAI_IMAGE_QUALITY || "low",
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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  getOrCreateScene
};
