const state = {
  unit: "metric",
  lastQuery: { city: "Detroit" }
};

const elements = {
  form: document.querySelector("#weatherForm"),
  cityInput: document.querySelector("#cityInput"),
  geoButton: document.querySelector("#geoButton"),
  metricButton: document.querySelector("#metricButton"),
  imperialButton: document.querySelector("#imperialButton"),
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
  pressureText: document.querySelector("#pressureText"),
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

  state.lastQuery = { city };
  loadWeather();
});

elements.geoButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.");
    return;
  }

  setStatus("Locating...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.lastQuery = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      loadWeather();
    },
    () => setStatus("Location permission was denied or unavailable."),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

[elements.metricButton, elements.imperialButton].forEach((button) => {
  button.addEventListener("click", () => {
    state.unit = button.dataset.unit;
    updateUnitButtons();
    loadWeather();
  });
});

function updateUnitButtons() {
  elements.metricButton.classList.toggle("active", state.unit === "metric");
  elements.imperialButton.classList.toggle("active", state.unit === "imperial");
}

async function loadWeather() {
  try {
    setStatus("Loading weather...");
    const params = new URLSearchParams({ units: state.unit });
    Object.entries(state.lastQuery).forEach(([key, value]) => params.set(key, value));

    const response = await fetch(`/api/weather?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Weather request failed.");
    }

    renderWeather(payload);
    setStatus("");
  } catch (error) {
    setStatus(error.message);
  }
}

function renderWeather({ weather, festival, prompt }) {
  const tempUnit = state.unit === "imperial" ? "°F" : "°C";
  const speedUnit = state.unit === "imperial" ? "mph" : "m/s";

  elements.emptyState.classList.add("hidden");
  elements.weatherContent.classList.remove("hidden");
  elements.locationText.textContent = [weather.city, weather.country].filter(Boolean).join(", ");
  elements.conditionText.textContent = weather.description || weather.condition;
  elements.weatherIcon.src = weather.icon;
  elements.weatherIcon.hidden = !weather.icon;
  elements.temperatureText.textContent = `${weather.temperature}${tempUnit}`;
  elements.feelsLikeText.textContent = `Feels like ${weather.feelsLike}${tempUnit}`;
  elements.humidityText.textContent = `${weather.humidity}%`;
  elements.windText.textContent = `${weather.windSpeed} ${speedUnit}`;
  elements.rangeText.textContent = `${weather.min}${tempUnit} / ${weather.max}${tempUnit}`;
  elements.pressureText.textContent = `${weather.pressure} hPa`;
  elements.promptText.textContent = prompt;

  renderFestival(festival);
}

function renderFestival(festival) {
  if (!festival || !festival.active) {
    elements.festivalCard.className = "festival hidden";
    return;
  }

  elements.festivalCard.className = `festival ${festival.theme}`;
  elements.festivalName.textContent = festival.name;
  elements.festivalHeadline.textContent = festival.headline;
  elements.festivalMessage.textContent = festival.message;
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

updateUnitButtons();
elements.cityInput.value = state.lastQuery.city;
loadWeather();
