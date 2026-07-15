# ADR-0005: Keycloak and OIDC

## Status

Accepted — 2026-07-15

## Context

The platform requires enterprise identity without storing local passwords.

## Decision

Use Keycloak OIDC Authorization Code with PKCE and secure server-managed sessions. Keycloak is identity source; application profiles/memberships remain in PostgreSQL.

## Alternatives considered

Local passwords, social login, and browser-stored bearer tokens.

## Consequences

Central identity and MFA readiness; Keycloak availability/configuration becomes operationally critical.

## Security implications

No tokens in localStorage, production default admins or committed secrets; cookies require Secure/SameSite/CSRF controls.

## Operational implications

Version-controlled local realm seed contains only local credentials; production realms and secrets are managed separately.
