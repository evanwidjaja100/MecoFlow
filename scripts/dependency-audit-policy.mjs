const EXPECTED_ADVISORIES = Object.freeze([
  ["GHSA-7p8r-x3mc-p8w7", "fast-uri", "3.1.4"],
  ["GHSA-rgw5-rvv9-x895", "brace-expansion", "5.0.8"],
  ["GHSA-5p4m-2wfm-xmqj", "js-yaml", "4.3.0"],
  ["GHSA-2v37-7h3g-55p8", "nanoid", "3.3.16"],
]);

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
    vulnerabilities.high !== 4 ||
    ["critical", "moderate", "low", "info"].some(
      (severity) => vulnerabilities[severity] !== 0,
    )
  ) {
    errors.push("dependency audit severity totals must be exactly four High");
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
