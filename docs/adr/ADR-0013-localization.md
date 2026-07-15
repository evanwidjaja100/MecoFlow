# ADR-0013: Localization strategy

## Status

Accepted — 2026-07-15

## Context

English and Indonesian users need consistent terminology and locale-aware presentation.

## Decision

Keep machine enums/error codes stable and English-readable; translate at presentation boundaries with `en` and `id` message catalogs and locale/timezone/number formatting.

## Alternatives considered

Hard-coded UI strings, translated database enums and separate applications per locale.

## Consequences

Translation-ready components and consistent APIs; catalogs require completeness checks and domain glossary ownership.

## Security implications

Authorization/error classification cannot depend on translated labels; localized errors remain safe and non-revealing.

## Operational implications

Default display timezone is Asia/Jakarta and currency IDR, both configurable without changing stored UTC values.
