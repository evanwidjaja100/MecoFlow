# UI/UX specification

MECO Flow uses a professional, information-dense industrial interface with configurable brand tokens. Internal desktop/tablet layouts use clear navigation, headings, breadcrumbs, environment indication outside production, explicit primary actions and visible blockers. Supplier layouts are mobile responsive and clearly identify the supplier organization.

Status is always text plus color. Controls are keyboard accessible with visible focus, semantic headings, labeled inputs, accessible validation/error summaries, named icon actions, useful loading/empty/error states, and sufficient contrast. Important lists use URL-backed filters, pagination and sorting. Warehouse and QA workflows prioritize tablet ergonomics.

Presentation is localization-ready for `en` and `id`; machine enums and API error codes remain untranslated. Dates/numbers/currency use locale formatting and configured `Asia/Jakarta` display timezone/`IDR` defaults. Phase 0 provides only an accessible system-foundation landing screen and dependency status; operational shells begin later.
