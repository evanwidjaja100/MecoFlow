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
