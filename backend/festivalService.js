const FIXED_FESTIVALS = [
  { month: 1, day: 1, name: "New Year's Day", theme: "new-year", message: "Fresh start weather check" },
  { month: 2, day: 14, name: "Valentine's Day", theme: "valentine", message: "Plan the forecast into your date" },
  { month: 3, day: 17, name: "St. Patrick's Day", theme: "spring", message: "A green hint for the day" },
  { month: 7, day: 4, name: "Independence Day", theme: "summer", message: "Outdoor plans need a sky check" },
  { month: 10, day: 31, name: "Halloween", theme: "halloween", message: "A moody overlay for the night" },
  { month: 12, day: 24, name: "Christmas Eve", theme: "winter", message: "Holiday travel weather" },
  { month: 12, day: 25, name: "Christmas Day", theme: "winter", message: "Holiday forecast at a glance" },
  { month: 12, day: 31, name: "New Year's Eve", theme: "new-year", message: "Countdown forecast ready" }
];

function getFestivalOverlay(date = new Date(), weather = {}) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fixedFestival = FIXED_FESTIVALS.find((festival) => festival.month === month && festival.day === day);

  if (fixedFestival) {
    return {
      active: true,
      ...fixedFestival,
      headline: `${fixedFestival.name}${weather.city ? ` in ${weather.city}` : ""}`
    };
  }

  const seasonal = getSeasonalOverlay(month, weather);
  return {
    active: true,
    ...seasonal
  };
}

function getSeasonalOverlay(month, weather = {}) {
  if ([12, 1, 2].includes(month)) {
    return {
      name: "Winter Mode",
      theme: "winter",
      message: "Cold-season comfort layer",
      headline: weather.city ? `Winter forecast for ${weather.city}` : "Winter forecast"
    };
  }

  if ([3, 4, 5].includes(month)) {
    return {
      name: "Spring Mode",
      theme: "spring",
      message: "Light seasonal overlay",
      headline: weather.city ? `Spring forecast for ${weather.city}` : "Spring forecast"
    };
  }

  if ([6, 7, 8].includes(month)) {
    return {
      name: "Summer Mode",
      theme: "summer",
      message: "Heat and outdoor planning layer",
      headline: weather.city ? `Summer forecast for ${weather.city}` : "Summer forecast"
    };
  }

  return {
    name: "Autumn Mode",
    theme: "autumn",
    message: "Crisp seasonal overlay",
    headline: weather.city ? `Autumn forecast for ${weather.city}` : "Autumn forecast"
  };
}

module.exports = {
  getFestivalOverlay
};
