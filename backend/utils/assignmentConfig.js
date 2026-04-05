const DEFAULT_RADIUS_KM = 20;
const DEFAULT_ASSIGNMENT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_ASSIGNMENT_ATTEMPTS = 5;

const toValidRadius = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 200) return null;
  return Number(parsed.toFixed(2));
};

let autoAssignRadiusKm = toValidRadius(process.env.MAX_AUTO_ASSIGN_DISTANCE_KM) || DEFAULT_RADIUS_KM;
const assignmentResponseTimeoutMs = Number(process.env.ASSIGNMENT_RESPONSE_TIMEOUT_MS || DEFAULT_ASSIGNMENT_TIMEOUT_MS);
const maxAssignmentAttempts = Number(process.env.MAX_ASSIGNMENT_ATTEMPTS || DEFAULT_MAX_ASSIGNMENT_ATTEMPTS);

function getAutoAssignRadiusKm() {
  return autoAssignRadiusKm;
}

function setAutoAssignRadiusKm(value) {
  const next = toValidRadius(value);
  if (next === null) return null;
  autoAssignRadiusKm = next;
  return autoAssignRadiusKm;
}

function getAssignmentResponseTimeoutMs() {
  if (!Number.isFinite(assignmentResponseTimeoutMs) || assignmentResponseTimeoutMs < 5000) {
    return DEFAULT_ASSIGNMENT_TIMEOUT_MS;
  }
  return assignmentResponseTimeoutMs;
}

function getMaxAssignmentAttempts() {
  if (!Number.isFinite(maxAssignmentAttempts) || maxAssignmentAttempts < 1) {
    return DEFAULT_MAX_ASSIGNMENT_ATTEMPTS;
  }
  return Math.floor(maxAssignmentAttempts);
}

module.exports = {
  DEFAULT_RADIUS_KM,
  DEFAULT_ASSIGNMENT_TIMEOUT_MS,
  DEFAULT_MAX_ASSIGNMENT_ATTEMPTS,
  getAutoAssignRadiusKm,
  setAutoAssignRadiusKm,
  getAssignmentResponseTimeoutMs,
  getMaxAssignmentAttempts,
};
