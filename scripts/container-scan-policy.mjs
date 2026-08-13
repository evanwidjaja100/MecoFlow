const REQUIRED_EXCEPTION_FIELDS = [
  "image",
  "vulnerabilityId",
  "packageName",
  "owner",
  "approvedBy",
  "expiresOn",
  "rationale",
  "compensatingControls",
];

const SHA_1 = /^[0-9a-f]{40}$/u;

export function requireCandidateImageVersion(appVersion, sourceSha) {
  if (!SHA_1.test(sourceSha ?? "")) {
    throw new Error("GITHUB_SHA must be a full 40-character commit SHA.");
  }
  if (appVersion !== sourceSha) {
    throw new Error(
      "APP_VERSION must exactly equal GITHUB_SHA for a release scan.",
    );
  }
  return appVersion;
}

export function candidateBuildTimestamp(value) {
  const date = new Date(value ?? "");
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "Candidate commit timestamp must be a valid ISO timestamp.",
    );
  }
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

export function validatePolicy(policy, now = new Date()) {
  if (policy?.schemaVersion !== 1) {
    throw new Error("Container scan policy schemaVersion must be 1.");
  }
  if (!String(policy.scannerImage ?? "").includes("@sha256:")) {
    throw new Error("scannerImage must be pinned by digest.");
  }
  if (!Array.isArray(policy.images) || policy.images.length === 0) {
    throw new Error("Container scan policy must list at least one image.");
  }
  if (
    !Array.isArray(policy.severities) ||
    [...policy.severities].sort().join(",") !== "CRITICAL,HIGH"
  ) {
    throw new Error(
      "Container scan policy severities must be exactly CRITICAL and HIGH.",
    );
  }
  if (!Array.isArray(policy.exceptions)) {
    throw new Error("Container scan policy exceptions must be an array.");
  }

  for (const exception of policy.exceptions) {
    for (const field of REQUIRED_EXCEPTION_FIELDS) {
      if (!String(exception?.[field] ?? "").trim()) {
        throw new Error(`Container scan exception is missing ${field}.`);
      }
    }
    if (exception.status !== "approved") {
      throw new Error(
        `Exception ${exception.vulnerabilityId}/${exception.packageName} is not approved.`,
      );
    }
    const expiry = new Date(`${exception.expiresOn}T23:59:59.999Z`);
    if (Number.isNaN(expiry.getTime())) {
      throw new Error(
        `Exception ${exception.vulnerabilityId}/${exception.packageName} has an invalid expiresOn date.`,
      );
    }
    if (expiry < now) {
      throw new Error(
        `Exception ${exception.vulnerabilityId}/${exception.packageName} expired on ${exception.expiresOn}.`,
      );
    }
  }
}

export function collectFindings(report, image) {
  return (report.Results ?? []).flatMap((result) =>
    (result.Vulnerabilities ?? []).map((vulnerability) => ({
      image,
      target: result.Target ?? "unknown",
      class: result.Class ?? "unknown",
      type: result.Type ?? "unknown",
      vulnerabilityId: vulnerability.VulnerabilityID,
      packageName: vulnerability.PkgName,
      installedVersion: vulnerability.InstalledVersion ?? "unknown",
      fixedVersion: vulnerability.FixedVersion ?? "",
      severity: vulnerability.Severity ?? "UNKNOWN",
      primaryUrl: vulnerability.PrimaryURL ?? "",
    })),
  );
}

export function findApprovedException(finding, exceptions) {
  return exceptions.find(
    (exception) =>
      exception.image === finding.image &&
      exception.vulnerabilityId === finding.vulnerabilityId &&
      exception.packageName === finding.packageName &&
      (!exception.target || exception.target === finding.target),
  );
}

export function evaluateFindings(findings, exceptions) {
  const accepted = [];
  const blocking = [];
  for (const finding of findings) {
    const exception = findApprovedException(finding, exceptions);
    if (exception) {
      accepted.push({ finding, exception });
    } else {
      blocking.push(finding);
    }
  }
  return { accepted, blocking };
}

export function expandImage(image, appVersion) {
  return image.replaceAll("${APP_VERSION}", appVersion);
}

export function validatePhaseZeroScanEvidence({
  summary,
  policy,
  appVersion,
  stepOutcome,
}) {
  const errors = [];
  const expectedImages = policy.images
    .map((image) => expandImage(image, appVersion))
    .sort();
  const results = Array.isArray(summary?.results) ? summary.results : [];
  const actualImages = results.map((result) => result?.image).sort();

  if (summary?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (summary?.scannerImage !== policy.scannerImage) {
    errors.push("scanner image does not match policy");
  }
  if (summary?.appVersion !== appVersion) {
    errors.push("application version does not match the candidate scan");
  }
  if (summary?.diagnosticMode !== false) {
    errors.push("a subset diagnostic cannot establish the Phase 0 baseline");
  }
  if (actualImages.join("\n") !== expectedImages.join("\n")) {
    errors.push("scan results must cover the exact policy image inventory");
  }
  const reportPaths = results.map((result) => result?.reportPath);
  const logPaths = results.map((result) => result?.logPath);
  if (new Set(reportPaths).size !== reportPaths.length) {
    errors.push("scan report paths must be unique");
  }
  if (new Set(logPaths).size !== logPaths.length) {
    errors.push("scan log paths must be unique");
  }

  for (const result of results) {
    if (!result || !["passed", "blocked"].includes(result.status)) {
      errors.push(`${result?.image ?? "unknown image"}: scan did not complete`);
      continue;
    }
    if (!/^sha256:[0-9a-f]{64}$/u.test(result.resolvedIdentity ?? "")) {
      errors.push(
        `${result.image}: resolved image identity must be an immutable sha256 image ID`,
      );
    }
    if (
      !Array.isArray(result.repoDigests) ||
      result.repoDigests.some(
        (digest) => !/^[^@\s]+@sha256:[0-9a-f]{64}$/u.test(digest),
      )
    ) {
      errors.push(`${result.image}: repository digest mapping is invalid`);
    }
    for (const field of ["findingCount", "acceptedCount", "blockingCount"]) {
      if (!Number.isInteger(result[field]) || result[field] < 0) {
        errors.push(`${result.image}: ${field} must be a non-negative integer`);
      }
    }
    if (result.status === "passed" && result.blockingCount !== 0) {
      errors.push(`${result.image}: passed result contains blockers`);
    }
    if (result.status === "blocked" && !(result.blockingCount > 0)) {
      errors.push(`${result.image}: blocked result has no blockers`);
    }
    if (result.findingCount !== result.acceptedCount + result.blockingCount) {
      errors.push(`${result.image}: finding counts are inconsistent`);
    }
    if (!String(result.reportPath ?? "").trim()) {
      errors.push(`${result.image}: report path is missing`);
    }
    if (!String(result.logPath ?? "").trim()) {
      errors.push(`${result.image}: log path is missing`);
    }
  }

  const expectedResult = results.some(
    (result) => !["passed"].includes(result.status),
  )
    ? "failed"
    : "passed";
  if (summary?.result !== expectedResult) {
    errors.push(`summary result must be ${expectedResult}`);
  }
  const expectedOutcome = expectedResult === "passed" ? "success" : "failure";
  if (stepOutcome !== expectedOutcome) {
    errors.push(`scan step outcome must be ${expectedOutcome}`);
  }

  return errors;
}
