# Monitoring

This directory contains the private Prometheus scrape configuration, six recording rules, seventeen actionable alert rules, black-box HTTPS probe, staging observation-only Alertmanager route, production receiver example, and fail-closed operational/capacity evidence templates.

Run `pnpm monitoring:config` and `pnpm monitoring:validate` before starting `compose.monitoring.yaml`. The staging receiver deliberately pages nobody. Real receiver configuration, authentication material, on-call schedules, drill evidence, capacity configuration/results, and provider evidence live outside Git. See `docs/MONITORING.md`, `docs/ON_CALL.md`, and `docs/CAPACITY_READINESS.md`.
