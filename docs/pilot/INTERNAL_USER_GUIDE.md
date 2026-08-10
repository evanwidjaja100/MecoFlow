# Internal user guide

## Standard flow

Sign in through the IdP. Open only assigned projects. Create/edit descriptive
project data, then use explicit transition commands with a truthful reason.
Import the fixed BOM template, resolve dry-run validation errors, confirm a
draft, submit for review, and release only after engineering approval. Create,
submit, and approve requisitions; create and send supplier-addressed POs; review
commitments and partial deliveries. Use readiness blockers and recommended
actions as decision support, not as permission to bypass a workflow.

## Control rules

- Never paste secrets, uncontrolled personal data, or hidden commercial terms
  into supplier-visible fields.
- Do not retry a failed mutation blindly; capture the request/correlation ID and
  check whether it committed.
- Never correct an immutable record in place. Follow `DATA_CORRECTION.md`.
- Confirm project/supplier scope before every document, PO, receipt, NCR, and
  export action.
- Report unexpected access, quantities, states, or missing audit evidence at once.
