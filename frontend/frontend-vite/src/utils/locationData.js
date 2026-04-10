// Utility to filter Indian locations for autocomplete fallback
import { LOCATION_DIRECTORY } from '../../../src/utils/locationData.js';

export function filterIndiaLocations(query, limit = 8) {
  if (!query) return [];
  const normalized = query.toLowerCase();
  const results = [];
  for (const state of LOCATION_DIRECTORY || []) {
    for (const city of state.cities) {
      if (city.name.toLowerCase().includes(normalized)) {
        results.push(city.name);
        if (results.length >= limit) return results;
      }
      for (const area of city.areas) {
        if (area.toLowerCase().includes(normalized)) {
          results.push(`${area}, ${city.name}`);
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}

export { LOCATION_DIRECTORY };
