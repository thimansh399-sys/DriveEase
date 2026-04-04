const DEFAULT_RADIUS_KM = 20;

const toValidRadius = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 200) return null;
  return Number(parsed.toFixed(2));
};

let autoAssignRadiusKm = toValidRadius(process.env.MAX_AUTO_ASSIGN_DISTANCE_KM) || DEFAULT_RADIUS_KM;

function getAutoAssignRadiusKm() {
  return autoAssignRadiusKm;
}

function setAutoAssignRadiusKm(value) {
  const next = toValidRadius(value);
  if (next === null) return null;
  autoAssignRadiusKm = next;
  return autoAssignRadiusKm;
}

module.exports = {
  DEFAULT_RADIUS_KM,
  getAutoAssignRadiusKm,
  setAutoAssignRadiusKm,
};
