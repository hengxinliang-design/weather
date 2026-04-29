const SEASONS = {
  spring: {
    season: "spring",
    tone: "fresh green bloom",
    palette: ["#6cad5f", "#d9f2d4", "#f7fbf4"],
    colorGrade: "soft green highlights, fresh air clarity, gentle contrast",
    prompt: "spring palette with fresh green bloom accents and soft natural saturation"
  },
  summer: {
    season: "summer",
    tone: "warm saturated daylight",
    palette: ["#f5b944", "#0f766e", "#fff2c2"],
    colorGrade: "warm sunlight, saturated foliage, crisp blue shadows",
    prompt: "summer palette with warm sunlight, saturated greens, energetic daylight contrast"
  },
  autumn: {
    season: "autumn",
    tone: "amber leaf warmth",
    palette: ["#c76f3a", "#f0b45a", "#f8eee7"],
    colorGrade: "amber highlights, copper foliage, warm low contrast",
    prompt: "autumn palette with amber leaves, copper warmth, cinematic seasonal softness"
  },
  winter: {
    season: "winter",
    tone: "cool blue clarity",
    palette: ["#5aa6c8", "#dbeafe", "#f8fbff"],
    colorGrade: "cool blue ambient light, clean whites, crisp shadow edges",
    prompt: "winter palette with cool blue clarity, clean whites, crisp atmospheric lighting"
  }
};

function mapSeason(month) {
  const normalizedMonth = normalizeMonth(month);

  if ([3, 4, 5].includes(normalizedMonth)) {
    return SEASONS.spring;
  }

  if ([6, 7, 8].includes(normalizedMonth)) {
    return SEASONS.summer;
  }

  if ([9, 10, 11].includes(normalizedMonth)) {
    return SEASONS.autumn;
  }

  return SEASONS.winter;
}

function normalizeMonth(month) {
  const value = Number(month);
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    return new Date().getMonth() + 1;
  }

  return value;
}

module.exports = {
  mapSeason
};
