# ADR-0002: pnpm and Turborepo

## Status

Accepted — 2026-07-15

## Context

Multiple TypeScript applications and shared packages need reproducible dependency and task management.

## Decision

Use a pnpm workspace with exact manifests/lockfile and Turborepo task orchestration.

## Alternatives considered

npm workspaces, Yarn, and independent repositories.

## Consequences

Fast shared installs and consistent task graphs; contributors must use the pinned pnpm and repository scripts.

## Security implications

Frozen lockfiles, controlled build scripts and dependency review limit supply-chain drift.

## Operational implications

CI and local development run the same named tasks; remote cache is optional and must not receive secrets.
