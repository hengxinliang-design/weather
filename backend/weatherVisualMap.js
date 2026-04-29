function mapWeatherVisual(code) {
  const map = {
    0: { condition: "Clear", scene: "clear sky", visual: "bright sunlight soft shadow" },
    1: { condition: "Mostly Clear", scene: "light cloud", visual: "soft sunlight scattered clouds" },
    2: { condition: "Partly Cloudy", scene: "partly cloudy", visual: "moving cloud shadow dynamic light" },
    3: { condition: "Overcast", scene: "overcast sky", visual: "diffused grey sky flat lighting" },
    45: { condition: "Fog", scene: "foggy street", visual: "low visibility volumetric fog" },
    61: { condition: "Rain", scene: "light rain", visual: "wet road reflection rain particles" },
    63: { condition: "Moderate Rain", scene: "moderate rain", visual: "raindrops splash reflective surface" },
    65: { condition: "Heavy Rain", scene: "heavy rain storm", visual: "dense rain dramatic wet lighting" },
    71: { condition: "Snow", scene: "light snow", visual: "soft snow particle winter mood" },
    73: { condition: "Snow", scene: "snowfall", visual: "falling snow cinematic atmosphere" },
    75: { condition: "Heavy Snow", scene: "heavy snow storm", visual: "deep snow accumulation winter lighting" },
    95: { condition: "Thunderstorm", scene: "thunderstorm", visual: "lightning dramatic sky high contrast" }
  };

  return map[code] || map[0];
}

module.exports = mapWeatherVisual;
