function buildWeatherPrompt(weather, festival, units) {
  const tempUnit = units === "imperial" ? "degrees Fahrenheit" : "degrees Celsius";
  const speedUnit = units === "imperial" ? "mph" : "m/s";
  const location = [weather.city, weather.country].filter(Boolean).join(", ");

  return {
    summary: `${location} is ${weather.temperature} ${tempUnit} with ${weather.description || weather.condition}.`,
    details: `Feels like ${weather.feelsLike} ${tempUnit}, humidity ${weather.humidity}%, wind ${weather.windSpeed} ${speedUnit}.`,
    visualPrompt: [
      `Create a ${weather.visual.mood} weather card for ${location}.`,
      `Use ${weather.visual.gradient} atmosphere, ${weather.visual.motion} motion, and accent color ${weather.visual.accent}.`,
      festival && festival.active ? `Blend in ${festival.name} using a ${festival.motif} overlay.` : "Keep overlays subtle."
    ].join(" "),
    displayLine: [
      `${weather.condition} visual engine`,
      festival && festival.active ? festival.name : "",
      `${weather.localTime} local`
    ]
      .filter(Boolean)
      .join(" / ")
  };
}

module.exports = {
  buildWeatherPrompt
};
