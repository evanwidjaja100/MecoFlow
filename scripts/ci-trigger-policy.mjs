const SHA_1 = /^[0-9a-f]{40}$/u;
const SUPPORTED_EVENTS = new Set(["pull_request", "push", "workflow_dispatch"]);

export function validateCiTrigger(env) {
  const errors = [];
  const eventName = env.GITHUB_EVENT_NAME?.trim() ?? "";
  const sourceSha = env.GITHUB_SHA?.trim() ?? "";
  const sourceRef = env.GITHUB_REF?.trim() ?? "";
  const actor = env.GITHUB_ACTOR?.trim() ?? "";
  const actorId = env.GITHUB_ACTOR_ID?.trim() ?? "";

  if (!SUPPORTED_EVENTS.has(eventName)) errors.push("unsupported GitHub event");
  if (!SHA_1.test(sourceSha))
    errors.push("GITHUB_SHA must be a full commit SHA");
  if (!actor || !/^\d+$/u.test(actorId)) {
    errors.push("GitHub actor login and numeric actor ID are required");
  }

  if (eventName === "workflow_dispatch") {
    const requestedSha = env.PHASE_ZERO_DISPATCH_CANDIDATE_SHA?.trim() ?? "";
    if (!SHA_1.test(requestedSha) || requestedSha !== sourceSha) {
      errors.push(
        "workflow_dispatch candidate_sha must exactly equal GITHUB_SHA",
      );
    }
    if (sourceRef !== "refs/heads/main") {
      errors.push(
        "workflow_dispatch reproduction must run from refs/heads/main",
      );
    }
  }

  return errors;
}
