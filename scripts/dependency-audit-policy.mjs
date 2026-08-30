const EXPECTED_ADVISORIES = Object.freeze([]);

export function validateDependencyAudit(report) {
  const errors = [];
  const advisories = Object.values(report?.advisories ?? {});
  const actual = advisories
    .map((advisory) => [
      advisory?.github_advisory_id,
      advisory?.module_name,
      advisory?.findings?.[0]?.version,
      advisory?.severity,
    ])
    .sort((left, right) => String(left[0]).localeCompare(String(right[0])));
  const expected = EXPECTED_ADVISORIES.map((entry) => [...entry, "high"]).sort(
    (left, right) => left[0].localeCompare(right[0]),
  );
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(
      "dependency audit must contain the exact recorded Phase 0 advisory set",
    );
  }
  const vulnerabilities = report?.metadata?.vulnerabilities ?? {};
  if (
    vulnerabilities.high !== EXPECTED_ADVISORIES.length ||
    ["critical", "moderate", "low", "info"].some(
      (severity) => vulnerabilities[severity] !== 0,
    )
  ) {
    errors.push(
      `dependency audit severity totals must be exactly ${EXPECTED_ADVISORIES.length} High`,
    );
  }
  for (const advisory of advisories) {
    if (
      !Array.isArray(advisory?.findings) ||
      advisory.findings.length !== 1 ||
      !Array.isArray(advisory.findings[0]?.paths) ||
      advisory.findings[0].paths.length === 0
    ) {
      errors.push(
        `${advisory?.github_advisory_id ?? "unknown"}: findings are incomplete`,
      );
    }
  }
  return errors;
}