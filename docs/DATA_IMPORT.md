# Data import

BOM imports will accept `.xlsx` and `.csv` through private, validated uploads. The worker calculates checksum, normalizes data, validates required columns/types/reference values, detects duplicates and ambiguous items, and produces row/field error or warning codes with human-readable explanations. A dry run and explicit user confirmation precede transactional draft-BOM creation and audit/outbox events.

Formulas and macros are never executed, invalid rows are never silently discarded, and ambiguous item matches are never automatically merged. Exports sanitize cells beginning with `=`, `+`, `-`, or `@`. Phase 0 establishes worker and object-storage boundaries only; import implementation begins in Phase 3.
