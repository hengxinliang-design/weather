const mapWeatherVisual = require("./weatherVisualMap");
const mapSunLighting = require("./sunLightingEngine");

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const VALID_UNITS = new Set(["metric", "imperial"]);

function normalizeUnits(units) {
  return VALID_UNITS.has(units) ? units : "metric";
}

async function getWeather(city, units = "metric") {
  return getWeatherByCity(city, units);
}

async function getWeatherByCity(city, units = "metric") {
  const location = await geocodeCity(city);
  return getWeatherForLocation(location, normalizeUnits(units));
}

async function getWeatherByCoords(lat, lon, units = "metric") {
  return getWeatherForLocation(
    {
      name: "Current location",
      country: "",
      latitude: lat,
      longitude: lon
    },
    normalizeUnits(units)
  );
}

async function geocodeCity(city) {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.reason || "City lookup failed.");
    error.statusCode = response.status;
    throw error;
  }

  if (!payload.results || !payload.results.length) {
    const error = new Error("City not found.");
    error.statusCode = 404;
    throw error;
  }

  return payload.results[0];
}

async function getWeatherForLocation(location, units) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", location.latitude);
  url.searchParams.set("longitude", location.longitude);
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("hourly", "relative_humidity_2m,cloud_cover,visibility");
  url.searchParams.set("timezone", "auto");

  if (units === "imperial") {
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
  }

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.reason || "Open-Meteo weather request failed.");
    error.statusCode = response.status;
    throw error;
  }

  if (!payload.current_weather) {
    throw new Error("Weather response did not include current weather.");
  }

  return mapWeather(payload, location, units);
}

function mapWeather(data, location, units) {
  const current = data.current_weather;
  const hourlyIndex = findHourlyIndex(data.hourly, current.time);
  const elevation = calculateSolarElevation(location.latitude, location.longitude, current.time, data.utc_offset_seconds || 0);
  const humidity = readHourlyValue(data.hourly, "relative_humidity_2m", hourlyIndex, 0);
  const cloudCover = readHourlyValue(data.hourly, "cloud_cover", hourlyIndex, 0);
  const visibility = readHourlyValue(data.hourly, "visibility", hourlyIndex, undefined);
  const visualWeather = mapWeatherVisual(current.weathercode);
  const sunLighting = mapSunLighting(elevation);
  const temperature = Math.round(current.temperature);

  return {
    city: location.name,
    country: location.country,
    coordinates: {
      lat: location.latitude,
      lon: location.longitude
    },
    units,
    provider: "open-meteo",
    timestamp: Math.floor(new Date(current.time).getTime() / 1000),
    temperature,
    temp: temperature,
    feelsLike: temperature,
    min: temperature - 2,
    max: temperature + 2,
    humidity,
    pressure: undefined,
    visibility,
    cloudCover,
    windSpeed: current.windspeed,
    windDirection: current.winddirection,
    weathercode: current.weathercode,
    condition: visualWeather.condition,
    description: visualWeather.scene,
    scene: visualWeather.scene,
    weatherLighting: visualWeather.visual,
    icon: "",
    sunrise: undefined,
    sunset: undefined,
    timezone: data.timezone,
    localTime: current.time ? current.time.slice(11, 16) : "",
    sunPhase: sunLighting.phase,
    sunLighting: sunLighting.lighting,
    visual: buildVisualModel(visualWeather, sunLighting, temperature, cloudCover)
  };
}

function findHourlyIndex(hourly, currentTime) {
  if (!hourly || !Array.isArray(hourly.time) || !currentTime) {
    return 0;
  }

  const exactIndex = hourly.time.indexOf(currentTime);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const currentHour = currentTime.slice(0, 13);
  const hourIndex = hourly.time.findIndex((time) => time.startsWith(currentHour));
  return hourIndex >= 0 ? hourIndex : 0;
}

function readHourlyValue(hourly, key, index, fallback) {
  if (!hourly || !Array.isArray(hourly[key])) {
    return fallback;
  }

  const value = hourly[key][index];
  return value === null || value === undefined ? fallback : value;
}

function calculateSolarElevation(latitude, longitude, localTime, utcOffsetSeconds = 0) {
  if (!localTime) {
    return 45;
  }

  const localTimestamp = Date.parse(`${localTime}:00Z`);
  if (Number.isNaN(localTimestamp)) {
    return 45;
  }

  const date = new Date(localTimestamp - utcOffsetSeconds * 1000);
  const dayOfYear = getDayOfYear(date);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gamma = (2 * Math.PI) / 365 * (dayOfYear - 1 + (hour - 12) / 24);
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const timeOffset = equationOfTime + 4 * Number(longitude);
  const trueSolarTime = ((hour * 60 + timeOffset) % 1440 + 1440) % 1440;
  const hourAngle = degreesToRadians(trueSolarTime / 4 - 180);
  const latitudeRadians = degreesToRadians(Number(latitude));
  const elevation = Math.asin(
    Math.sin(latitudeRadians) * Math.sin(declination) +
      Math.cos(latitudeRadians) * Math.cos(declination) * Math.cos(hourAngle)
  );

  return radiansToDegrees(elevation);
}

function getDayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function buildVisualModel(visualWeather, sunLighting, temperature, cloudCover) {
  const condition = visualWeather.condition.toLowerCase();
  const scene = visualWeather.scene.toLowerCase();

  if (condition.includes("thunder")) {
    return {
      mood: "electric",
      gradient: "storm",
      accent: "#8b5cf6",
      motion: "pulse",
      scene: visualWeather.scene,
      weatherLighting: visualWeather.visual,
      sunPhase: sunLighting.phase,
      sunLighting: sunLighting.lighting
    };
  }

  if (condition.includes("rain")) {
    return {
      mood: "rain",
      gradient: "rain",
      accent: "#2563eb",
      motion: "fall",
      scene: visualWeather.scene,
      weatherLighting: visualWeather.visual,
      sunPhase: sunLighting.phase,
      sunLighting: sunLighting.lighting
    };
  }

  if (condition.includes("snow")) {
    return {
      mood: "snow",
      gradient: "snow",
      accent: "#38bdf8",
      motion: "float",
      scene: visualWeather.scene,
      weatherLighting: visualWeather.visual,
      sunPhase: sunLighting.phase,
      sunLighting: sunLighting.lighting
    };
  }

  if (condition.includes("fog")) {
    return {
      mood: "mist",
      gradient: "mist",
      accent: "#64748b",
      motion: "drift",
      scene: visualWeather.scene,
      weatherLighting: visualWeather.visual,
      sunPhase: sunLighting.phase,
      sunLighting: sunLighting.lighting
    };
  }

  if (temperature >= 30) {
    return {
      mood: "heat",
      gradient: "heat",
      accent: "#ea580c",
      motion: "shimmer",
      scene: visualWeather.scene,
      weatherLighting: visualWeather.visual,
      sunPhase: sunLighting.phase,
      sunLighting: sunLighting.lighting
    };
  }

  if (cloudCover >= 70 || scene.includes("cloud") || condition.includes("cloud")) {
    return {
      mood: "cloud",
      gradient: "cloud",
      accent: "#475569",
      motion: "drift",
      scene: visualWeather.scene,
      weatherLighting: visualWeather.visual,
      sunPhase: sunLighting.phase,
      sunLighting: sunLighting.lighting
    };
  }

  return {
    mood: "clear",
    gradient: "clear",
    accent: "#0f766e",
    motion: "glow",
    scene: visualWeather.scene,
    weatherLighting: visualWeather.visual,
    sunPhase: sunLighting.phase,
    sunLighting: sunLighting.lighting
  };
}

module.exports = {
  getWeather,
  getWeatherByCity,
  getWeatherByCoords,
  calculateSolarElevation,
  normalizeUnits
};
