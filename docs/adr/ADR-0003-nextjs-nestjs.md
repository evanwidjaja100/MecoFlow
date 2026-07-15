# ADR-0003: Next.js frontend and NestJS backend

## Status

Accepted — 2026-07-15

## Context

The product needs responsive server-capable UI and a structured REST application layer.

## Decision

Use Next.js App Router for web and NestJS for API; use a small Node worker sharing validated packages.

## Alternatives considered

SPA-only React, monolithic Next.js route handlers, and other backend frameworks.

## Consequences

Clear deployable boundaries and framework conventions at the cost of two runtime processes.

## Security implications

Business authority stays in NestJS; Next.js cannot become an authorization authority.

## Operational implications

Web and API have separate health, scaling and environment settings.
