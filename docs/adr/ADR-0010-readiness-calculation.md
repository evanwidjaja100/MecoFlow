# ADR-0010: Material-readiness calculation

## Status

Accepted — 2026-07-15

## Context

Management needs an explainable forecast without aggregate scores masking critical failures.

## Decision

Implement a pure, deterministic, versioned calculation over released active requirements using documented stage scores, criticality weights and overriding readiness gates; persist explanations and model version in snapshots.

## Alternatives considered

Opaque single KPI, manually set status and non-versioned database formulas.

## Consequences

Reproducible results and clear blockers; rule changes need tests, documentation, version increment and snapshot recalculation planning.

## Security implications

Readiness inputs/results inherit project and supplier field-level authorization.

## Operational implications

Worker recalculation is idempotent and observable; old snapshot versions remain interpretable.
