# Weather Visual Engine

A local runnable H5 weather visual engine powered by OpenWeatherMap. It combines geolocation, saved city management, unit switching, festival overlays, and a prompt-builder module for rendering weather as a visual card experience.

## Features

- Geolocation auto detection with city resolution through OpenWeatherMap weather data
- City manager with saved cities in browser `localStorage`
- Metric and imperial unit switch
- Festival and seasonal overlay system
- Prompt builder module that returns display copy and a visual-generation prompt
- OpenAI image generation for automatic isometric weather scenes
- Local image cache served from `public/generated/`
- OpenWeatherMap integration through a Node Express backend
- Static H5 frontend served by Express
- Responsive card UI for desktop and mobile

## Project Structure

```text
.
├── backend/
│   ├── festivalService.js
│   ├── imageService.js
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
OPENAI_API_KEY=your_openai_api_key
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=low
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
- `scene`: generated isometric scene metadata with a cached local image path when available

## Image Generation

When `/api/weather` succeeds, the backend builds an isometric scene prompt from the normalized weather, festival overlay, and visual prompt. It then:

1. Hashes the prompt to create a stable cache key.
2. Checks `public/generated/` for a cached PNG.
3. Generates a new image through OpenAI only on cache miss.
4. Returns the local image path for the homepage to render.

Generated images are local runtime artifacts and are ignored by git.

## Environment

See `.env.example`:

```text
OPENWEATHER_API_KEY=your_openweathermap_api_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=low
PORT=3000
```
