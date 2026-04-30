const STORAGE_KEY = "weatherVisualEngineCities";
const DEFAULT_CITIES = ["Detroit", "New York", "San Francisco"];

const state = {
  unit: localStorage.getItem("weatherVisualEngineUnit") || "metric",
  cities: readCities(),
  activeCity: "",
  lastQuery: null
};

const elements = {
  form: document.querySelector("#weatherForm"),
  cityInput: document.querySelector("#cityInput"),
  cityList: document.querySelector("#cityList"),
  geoButton: document.querySelector("#geoButton"),
  metricButton: document.querySelector("#metricButton"),
  imperialButton: document.querySelector("#imperialButton"),
  visualStage: document.querySelector("#visualStage"),
  sceneCard: document.querySelector("#sceneCard"),
  sceneImage: document.querySelector("#sceneImage"),
  keywordScene: document.querySelector("#keywordScene"),
  keywordBadge: document.querySelector("#keywordBadge"),
  keywordTitle: document.querySelector("#keywordTitle"),
  keywordSubtitle: document.querySelector("#keywordSubtitle"),
  keywordList: document.querySelector("#keywordList"),
  keywordHighlights: document.querySelector("#keywordHighlights"),
  sceneStatus: document.querySelector("#sceneStatus"),
  festivalCard: document.querySelector("#festivalCard"),
  festivalName: document.querySelector("#festivalName"),
  festivalHeadline: document.querySelector("#festivalHeadline"),
  festivalMessage: document.querySelector("#festivalMessage"),
  emptyState: document.querySelector("#emptyState"),
  weatherContent: document.querySelector("#weatherContent"),
  locationText: document.querySelector("#locationText"),
  conditionText: document.querySelector("#conditionText"),
  weatherIcon: document.querySelector("#weatherIcon"),
  temperatureText: document.querySelector("#temperatureText"),
  feelsLikeText: document.querySelector("#feelsLikeText"),
  humidityText: document.querySelector("#humidityText"),
  windText: document.querySelector("#windText"),
  rangeText: document.querySelector("#rangeText"),
  cloudText: document.querySelector("#cloudText"),
  promptLabel: document.querySelector("#promptLabel"),
  promptSummary: document.querySelector("#promptSummary"),
  promptDetails: document.querySelector("#promptDetails"),
  promptText: document.querySelector("#promptText"),
  statusText: document.querySelector("#statusText")
};

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = elements.cityInput.value.trim();
  if (!city) {
    setStatus("Enter a city name.");
    return;
  }

  addCity(city);
  loadCity(city);
  elements.cityInput.value = "";
});

elements.geoButton.addEventListener("click", detectLocation);

[elements.metricButton, elements.imperialButton].forEach((button) => {
  button.addEventListener("click", () => {
    state.unit = button.dataset.unit;
    localStorage.setItem("weatherVisualEngineUnit", state.unit);
    updateUnitButtons();
    if (state.lastQuery) {
      loadWeather(state.lastQuery);
    }
  });
});

function readCities() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_CITIES;
  } catch {
    return DEFAULT_CITIES;
  }
}

function saveCities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cities));
}

function addCity(city) {
  const normalized = normalizeCity(city);
  const exists = state.cities.some((savedCity) => normalizeCity(savedCity) === normalized);
  if (!exists) {
    state.cities = [city, ...state.cities].slice(0, 8);
    saveCities();
    renderCities();
  }
}

function removeCity(city) {
  state.cities = state.cities.filter((savedCity) => normalizeCity(savedCity) !== normalizeCity(city));
  saveCities();
  renderCities();
}

function normalizeCity(city) {
  return city.trim().toLowerCase();
}

function renderCities() {
  elements.cityList.innerHTML = "";
  state.cities.forEach((city) => {
    const row = document.createElement("div");
    row.className = `city-pill${normalizeCity(city) === normalizeCity(state.activeCity) ? " active" : ""}`;

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.textContent = city;
    selectButton.addEventListener("click", () => loadCity(city));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-city";
    deleteButton.textContent = "×";
    deleteButton.title = `Remove ${city}`;
    deleteButton.addEventListener("click", () => removeCity(city));

    row.append(selectButton, deleteButton);
    elements.cityList.append(row);
  });
}

function loadCity(city) {
  state.activeCity = city;
  state.lastQuery = { city };
  renderCities();
  loadWeather(state.lastQuery);
}

function detectLocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.");
    loadCity(state.cities[0]);
    return;
  }

  setStatus("Auto detecting city...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.activeCity = "Current location";
      state.lastQuery = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      renderCities();
      loadWeather(state.lastQuery);
    },
    () => {
      setStatus("Location unavailable. Showing the first saved city.");
      loadCity(state.cities[0]);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

async function loadWeather(query) {
  try {
    setStatus("Rendering weather visual...");
    const params = new URLSearchParams({ units: state.unit });
    Object.entries(query).forEach(([key, value]) => params.set(key, value));

    const response = await fetch(`/api/weather?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Weather request failed.");
    }

    if (payload.weather.city) {
      state.activeCity = payload.weather.city;
      addCity(payload.weather.city);
    }

    renderWeather(payload);
    renderCities();
    setStatus("");
  } catch (error) {
    setStatus(error.message);
  }
}

function renderWeather({ weather, festival, prompt, scene }) {
  const tempUnit = state.unit === "imperial" ? "°F" : "°C";
  const speedUnit = state.unit === "imperial" ? "mph" : "m/s";

  elements.emptyState.classList.add("hidden");
  elements.weatherContent.classList.remove("hidden");
  elements.visualStage.dataset.mood = weather.visual.mood;
  elements.locationText.textContent = [weather.city, weather.country].filter(Boolean).join(", ");
  elements.conditionText.textContent = `${weather.description || weather.condition} / ${weather.localTime} local`;
  elements.weatherIcon.src = weather.icon;
  elements.weatherIcon.hidden = !weather.icon;
  elements.temperatureText.textContent = `${weather.temperature}${tempUnit}`;
  elements.feelsLikeText.textContent = `Feels like ${weather.feelsLike}${tempUnit}`;
  elements.humidityText.textContent = `${weather.humidity}%`;
  elements.windText.textContent = `${weather.windSpeed} ${speedUnit}`;
  elements.rangeText.textContent = `${weather.min}${tempUnit} / ${weather.max}${tempUnit}`;
  elements.cloudText.textContent = `${weather.cloudCover}%`;
  elements.promptLabel.textContent = prompt.displayLine;
  elements.promptSummary.textContent = prompt.summary;
  elements.promptDetails.textContent = prompt.details;
  elements.promptText.textContent = prompt.visualPrompt;
  document.documentElement.style.setProperty("--dynamic-accent", weather.visual.accent);

  renderScene(scene);
  renderFestival(festival);
}

function renderScene(scene) {
  if (!scene) {
    elements.sceneCard.classList.add("hidden");
    return;
  }

  elements.sceneCard.classList.remove("hidden");
  if (scene.type === "keywords" && scene.keywordScene) {
    renderKeywordScene(scene.keywordScene);
    elements.sceneCard.classList.add("keyword-mode");
    elements.sceneImage.hidden = true;
    elements.sceneImage.src = "";
    elements.keywordScene.classList.remove("hidden");
    elements.sceneStatus.textContent = "Image generation paused / weather keywords shown instantly";
    return;
  }

  elements.sceneCard.classList.remove("keyword-mode");
  elements.keywordScene.classList.add("hidden");
  elements.sceneImage.hidden = !scene.path;
  elements.sceneImage.src = scene.path || "";
  elements.sceneStatus.textContent = scene.path
    ? `Generated isometric scene / ${scene.output.size}${scene.cached ? " / cached" : " / fresh"}`
    : scene.error || "Scene image is not available.";
}

function renderKeywordScene(keywordScene) {
  elements.keywordBadge.textContent = "Weather keywords";
  elements.keywordTitle.textContent = keywordScene.title;
  elements.keywordSubtitle.textContent = keywordScene.subtitle;
  elements.keywordList.innerHTML = "";
  elements.keywordHighlights.innerHTML = "";

  keywordScene.keywords.forEach((keyword) => {
    const item = document.createElement("span");
    item.textContent = keyword;
    elements.keywordList.append(item);
  });

  keywordScene.highlights.forEach((highlight) => {
    const card = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    label.textContent = highlight.label;
    value.textContent = highlight.value;
    card.append(label, value);
    elements.keywordHighlights.append(card);
  });
}

function renderFestival(festival) {
  if (!festival || !festival.active) {
    elements.festivalCard.className = "festival hidden";
    return;
  }

  elements.festivalCard.className = `festival ${festival.theme}`;
  elements.festivalName.textContent = festival.name;
  elements.festivalHeadline.textContent = festival.headline;
  elements.festivalMessage.textContent = `${festival.message} / ${festival.motif} motif`;
}

function updateUnitButtons() {
  elements.metricButton.classList.toggle("active", state.unit === "metric");
  elements.imperialButton.classList.toggle("active", state.unit === "imperial");
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

updateUnitButtons();
renderCities();
detectLocation();
