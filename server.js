require("dotenv").config();

const express = require("express");
const path = require("path");
const weatherService = require("./backend/weatherService");
const festivalService = require("./backend/festivalService");
const promptBuilder = require("./backend/promptBuilder");
const imageService = require("./backend/imageService");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/weather", async (req, res) => {
  try {
    const { city, lat, lon, units = "metric" } = req.query;
    const normalizedUnits = weatherService.normalizeUnits(units);

    let weather;
    if (lat && lon) {
      weather = await weatherService.getWeatherByCoords(lat, lon, normalizedUnits);
    } else if (city) {
      weather = await weatherService.getWeatherByCity(city, normalizedUnits);
    } else {
      return res.status(400).json({ error: "Provide either city or lat/lon." });
    }

    const festival = festivalService.getFestivalOverlay(new Date(), weather);
    const prompt = promptBuilder.buildWeatherPrompt(weather, festival, normalizedUnits);
    const scene = await imageService.getOrCreateScene(weather, festival, prompt);

    return res.json({ weather, festival, prompt, scene });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || "Weather request failed." });
  }
});

app.get("/api/festivals", (req, res) => {
  const city = req.query.city || "";
  const weather = city ? { city } : undefined;
  res.json({ festival: festivalService.getFestivalOverlay(new Date(), weather) });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`H5 weather app listening on http://localhost:${port}`);
});
