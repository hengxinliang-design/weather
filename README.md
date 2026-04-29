# Weather Visual Engine

A local runnable H5 weather visual engine powered by OpenWeatherMap. It combines geolocation, saved city management, unit switching, festival overlays, and a prompt-builder module for rendering weather as a visual card experience.

## Features

- Geolocation auto detection with city resolution through OpenWeatherMap weather data
- City manager with saved cities in browser `localStorage`
- Metric and imperial unit switch
- Festival and seasonal overlay system
- Prompt builder module that returns display copy and a visual-generation prompt
- OpenWeatherMap integration through a Node Express backend
- Static H5 frontend served by Express
- Responsive card UI for desktop and mobile

## Project Structure

```text
.
├── backend/
│   ├── festivalService.js
│   ├── promptBuilder.js
│   └── weatherService.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
├── server.js
├── package.json
└── .env.example
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Add your OpenWeatherMap key:

```text
OPENWEATHER_API_KEY=your_openweathermap_api_key
PORT=3000
```

4. Start the server:

```bash
npm start
```

5. Open the app:

```text
http://localhost:3000
```

## API

### `GET /api/weather`

Query by city:

```text
/api/weather?city=Detroit&units=metric
```

Query by coordinates:

```text
/api/weather?lat=42.3314&lon=-83.0458&units=imperial
```

Response includes:

- `weather`: normalized OpenWeatherMap data and visual metadata
- `festival`: active festival or seasonal overlay
- `prompt`: structured display copy and visual prompt

## Environment

See `.env.example`:

```text
OPENWEATHER_API_KEY=your_openweathermap_api_key
PORT=3000
```
