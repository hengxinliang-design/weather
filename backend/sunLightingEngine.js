function mapSunLighting(elevation) {
  if (elevation > 30) {
    return { phase: "midday", lighting: "strong overhead sunlight crisp shadow" };
  }

  if (elevation > 10) {
    return { phase: "morning", lighting: "soft directional sunlight long shadow" };
  }

  if (elevation > 0) {
    return { phase: "golden_hour", lighting: "warm cinematic golden hour light" };
  }

  if (elevation > -6) {
    return { phase: "sunset", lighting: "orange horizon glow atmospheric depth" };
  }

  if (elevation > -12) {
    return { phase: "twilight", lighting: "blue hour soft ambient lighting" };
  }

  return { phase: "night", lighting: "night environment cinematic contrast rim light" };
}

module.exports = mapSunLighting;
