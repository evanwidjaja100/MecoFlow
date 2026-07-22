# Data import

BOM imports will accept `.xlsx` and `.csv` through private, validated uploads. The worker calculates checksum, normalizes data, validates required columns/types/reference values, detects duplicates and ambiguous items, and produces row/field error or warning codes with human-readable explanations. A dry run and explicit user confirmation precede transactional draft-BOM creation and audit/outbox events.

Formulas and macros are never executed, invalid rows are never silently discarded, and ambiguous item matches are never automatically merged. Exports sanitize cells beginning with `=`, `+`, `-`, or `@`.

Phase 3B implements this strategy with a 5 MiB/5,000-row ceiling, fixed CSV/XLSX templates, private opaque objects, SHA-256 verification, quarantine/validated/rejected states, bounded ZIP/XML XLSX parsing, identifier-only outbox jobs, retry/backoff, and full row persistence. Encrypted XLSX entries, macros, external links, embedded objects, unsafe archive paths/expansion, binary CSV, MIME/extension mismatches, and unsupported extensions are rejected. Formula cells and formula-like CSV fields become explicit row errors and are never evaluated.

An item code is matched exactly after uppercase normalization. When code is blank, an exact name match is accepted only if unique and produces a warning. Ambiguity is an error. Confirmation requires a ready dry run with zero errors, a literal confirmation value, and the expected import version; it then creates one source-linked draft revision transactionally.
