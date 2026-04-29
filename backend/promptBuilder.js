function buildPrompt({ city, weather, festival }) {
  return {
    summary: `${city} ${weather.condition} ${weather.temp || weather.temperature}°`,
    details: `${weather.scene || weather.description}, ${weather.sunLighting}`,
    visualPrompt: `
45° isometric miniature city scene

City: ${city}

Weather: ${weather.condition}

Scene: ${weather.scene || weather.description}

Lighting: ${weather.sunLighting}

Weather lighting: ${weather.weatherLighting}

Festival overlay: ${festival || "none"}

PBR materials
global illumination
cinematic atmosphere
`.trim()
  };
}

function buildWeatherPrompt(weather, festival) {
  const city = [weather.city, weather.country].filter(Boolean).join(", ");
  const prompt = buildPrompt({
    city,
    weather,
    festival: festival && festival.active ? festival.name : ""
  });

  return {
    ...prompt,
    displayLine: [
      `${weather.condition} visual engine`,
      festival && festival.active ? festival.name : "",
      weather.localTime ? `${weather.localTime} local` : ""
    ]
      .filter(Boolean)
      .join(" / ")
  };
}

module.exports = {
  buildPrompt,
  buildWeatherPrompt
};
