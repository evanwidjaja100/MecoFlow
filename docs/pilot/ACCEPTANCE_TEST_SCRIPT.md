# Pilot acceptance-test script

## Preconditions

- Approved release-candidate version and source revision are recorded.
- Staging stack is healthy behind TLS; migrations, seed, and smoke preparation
  completed using `docs/OPERATIONS_RUNBOOK.md`.
- External ignored runtime secrets exist; no value is copied into evidence.
- A verified clean-environment restoration exists for this candidate or is an
  explicit release blocker.

## Execute

From the repository root:

```powershell
pnpm staging:pilot-acceptance
```

The command checks all pilot artifacts, runs the guarded pilot baseline job, and
executes `tests/staging/pilot-acceptance.spec.ts` against `STAGING_PUBLIC_URL`.
It must verify real OIDC authentication, no browser token storage, version
metadata, four command-activated projects, critical/noncritical BOM release,
approved procurement, supplier-safe PO view, partial ASN/receipt, certificate
requirement, inspection quarantine, issued/responded NCR, internal readiness and
reports, and bidirectional supplier isolation.

Then execute the release-candidate regression gates:

```powershell
pnpm verify
pnpm test:authorization
pnpm openapi:check
pnpm test:e2e
```

## Record

Capture UTC start/end, application/schema version, namespace, commands and exit
codes, Playwright report/artifacts, project/ASN/receipt/NCR references, isolation
statuses/envelopes, defects, corrective action, reviewer, and release decision.
Any checksum, authentication, authorization/isolation, readiness, restoration,
or critical data-integrity failure makes acceptance fail; do not waive it by
rerunning only the failed assertion.
