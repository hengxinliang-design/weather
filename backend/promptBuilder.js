function buildWeatherPrompt(weather, festival, units) {
  const tempUnit = units === "imperial" ? "F" : "C";
  const speedUnit = units === "imperial" ? "mph" : "m/s";
  const location = [weather.city, weather.country].filter(Boolean).join(", ");

  return [
    `${location} is ${weather.temperature} ${tempUnit} with ${weather.description || weather.condition}.`,
    `Feels like ${weather.feelsLike} ${tempUnit}, humidity ${weather.humidity}%, wind ${weather.windSpeed} ${speedUnit}.`,
    festival && festival.active ? `${festival.name}: ${festival.message}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

module.exports = {
  buildWeatherPrompt
};
