const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const VALID_UNITS = new Set(["metric", "imperial"]);

function normalizeUnits(units) {
  return VALID_UNITS.has(units) ? units : "metric";
}

function requireApiKey() {
  if (!process.env.OPENWEATHER_API_KEY) {
    const error = new Error("Missing OPENWEATHER_API_KEY. Add it to .env or export it before starting the server.");
    error.statusCode = 500;
    throw error;
  }

  return process.env.OPENWEATHER_API_KEY;
}

async function requestOpenWeather(params) {
  const apiKey = requireApiKey();
  const url = new URL(OPENWEATHER_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set("appid", apiKey);

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message || "OpenWeatherMap request failed.");
    error.statusCode = response.status;
    throw error;
  }

  return mapWeather(payload, params.units);
}

function getWeatherByCity(city, units = "metric") {
  return requestOpenWeather({
    q: city,
    units: normalizeUnits(units)
  });
}

function getWeatherByCoords(lat, lon, units = "metric") {
  return requestOpenWeather({
    lat,
    lon,
    units: normalizeUnits(units)
  });
}

function mapWeather(data, units) {
  const condition = data.weather && data.weather[0] ? data.weather[0] : {};

  return {
    city: data.name,
    country: data.sys && data.sys.country,
    coordinates: data.coord,
    units,
    timestamp: data.dt,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    min: Math.round(data.main.temp_min),
    max: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    condition: condition.main || "Weather",
    description: condition.description || "",
    icon: condition.icon ? `https://openweathermap.org/img/wn/${condition.icon}@2x.png` : "",
    sunrise: data.sys && data.sys.sunrise,
    sunset: data.sys && data.sys.sunset
  };
}

module.exports = {
  getWeatherByCity,
  getWeatherByCoords,
  normalizeUnits
};
