const EARTH_RADIUS_KM = 6371;

const toRadians = (value) => (Number(value) * Math.PI) / 180;

export const calculateDistanceKm = (from, to) => {
  const fromLat = Number(from?.latitude);
  const fromLng = Number(from?.longitude);
  const toLat = Number(to?.latitude);
  const toLng = Number(to?.longitude);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return null;
  }

  const latDiff = toRadians(toLat - fromLat);
  const lngDiff = toRadians(toLng - fromLng);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) *
    Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
};

const extractDriverCoords = (driver) => {
  const latitude = Number(driver?.currentLocation?.latitude);
  const longitude = Number(driver?.currentLocation?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

export const annotateDriversWithDistance = (drivers, userCoords) => {
  if (!Array.isArray(drivers)) {
    return [];
  }

  return drivers
    .map((driver) => {
      const existingDistance = Number(driver?.distance);
      const fallbackDistance = calculateDistanceKm(userCoords, extractDriverCoords(driver));
      const distance = Number.isFinite(existingDistance) ? existingDistance : fallbackDistance;

      return {
        ...driver,
        distance: Number.isFinite(distance) ? distance : null,
      };
    })
    .sort((left, right) => {
      const leftDistance = Number(left.distance);
      const rightDistance = Number(right.distance);

      if (Number.isFinite(leftDistance) && Number.isFinite(rightDistance)) {
        return leftDistance - rightDistance;
      }

      if (Number.isFinite(leftDistance)) return -1;
      if (Number.isFinite(rightDistance)) return 1;
      return 0;
    });
};
