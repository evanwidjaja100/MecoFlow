# Performance and data-access review

## Scope and methodology

This Phase 9B review covers common list/dashboard reads, report aggregation,
readiness calculation, BOM import parsing, supplier KPI calculation, worker
processing shape, concurrency-sensitive allocation/receipt commands, browser
bundle output, caching, and PostgreSQL access paths. It adds no business
feature and does not change authorization or domain calculation definitions.

The review used static repository inspection for unbounded reads, N+1
patterns, cache behavior, and transaction boundaries; `EXPLAIN (ANALYZE,
BUFFERS)` against the accumulated local integration database before and after
the index change; a repeatable synthetic calculation/import workload through
`pnpm performance:measure`; and existing correctness, authorization,
integration, concurrency, build, and browser tests.

The timing results are single-run engineering measurements, not statistically
rigorous production benchmarks. They identify large order-of-magnitude
problems and provide local regression evidence. Production capacity must be
validated on production-equivalent hardware and data distributions.

## Environment and representative workloads

Measurements were taken on Microsoft Windows 10 with an Intel Core i7-7700HQ
(4 cores/8 logical processors), approximately 16 GiB RAM, Node.js 24.18.0,
pnpm 11.13.0, and PostgreSQL 18.4 in Docker Desktop. Other development
processes and the Docker virtual machine shared the host, so absolute latency
is conservative and variable.

The accumulated local database contained the following representative
cardinalities before remediation:

| Relation or workload       |                                                              Rows/input |
| -------------------------- | ----------------------------------------------------------------------: |
| Readiness snapshots        |                                                                  17,243 |
| Audit events               |                                                                   8,164 |
| Outbox events              |                                                                   4,492 |
| Notifications              |                                                                   1,324 |
| Work packages              |                                                                     728 |
| Purchase-order allocations |                                                                     721 |
| Purchase orders            |                                                                     673 |
| Items                      |                                                                     548 |
| Goods receipts             |                                                                     517 |
| Advance shipment notices   |                                        503 before the baseline test run |
| Readiness calculation      |                                                    5,000 material lines |
| BOM import                 |                                          5,000 CSV rows / 314,946 bytes |
| Supplier scorecard         | 10,000 delivery lines, 10,000 inspections, 10,000 NCRs, 12 trend months |

The 5,000-row BOM/readiness workload matches the enforced import row ceiling.
The scorecard workload exercises the synchronous 10,000-row source guard and
the maximum documented 12-month trend period.

## Baseline measurements

| Workload                                         |                                    Baseline result |
| ------------------------------------------------ | -------------------------------------------------: |
| Latest readiness snapshot for one project        |                                           0.585 ms |
| Latest project snapshot per management portfolio | 120.825 ms for 261 PROJECT snapshots / 94 projects |
| One-project ASN list                             |                              0.704 ms for 518 rows |
| 5,000-line readiness calculation                 |                                          200.31 ms |
| 5,000-row CSV parse and validation               |                                          115.44 ms |
| 10k/10k/10k supplier scorecard with 12 trends    |                                      138,644.31 ms |
| Existing Next static assets                      |                                648,793 bytes total |
| Existing Next static chunk assets                |                      648,398 bytes across 10 files |

The portfolio plan used the existing
`readiness_snapshots_project_scope_calculated_idx`, an incremental sort, and a
`Unique` step. It read 261 qualifying rows and took 120.825 ms. The single
project lookup was already supported by that index and needed no additional
optimization.

The ASN plan used a sequential scan because virtually the entire small table
belonged to the representative project. Its sub-millisecond execution did not
justify an extra index. Response growth, rather than database scan latency, is
the remaining risk for that endpoint.

## Findings and measured remediation

### Supplier scorecard timestamp conversion

The KPI calculator created a new `Intl.DateTimeFormat` for every timestamp
conversion and repeated those conversions across the overall period and every
monthly trend bucket. At the representative maximum, this produced a
138.6-second CPU-bound calculation.

The formatter is now module-scoped and immutable. Each arrival, inspection,
NCR, and as-of timestamp is converted to its Jakarta date once per scorecard
calculation before the overall and monthly passes. KPI formulas, fixed-scale
arithmetic, cohort rules, model version, and input validation are unchanged.

The final representative measurement was 1,749.67 ms, a 98.7% reduction from
baseline. The intermediate formatter-only change measured 7,098.22 ms, which
confirmed that repeated formatter construction was the dominant defect and
that one-time normalization addressed the remaining repeated work. The
trade-off is a short-lived normalized copy of the input arrays; measured heap
growth was approximately 1.7 MiB in the final run.

### Readiness latest-per-project access

The portfolio/report access pattern needs project snapshots ordered by
`projectId`, newest `calculatedAt`, and deterministic descending `id`. A
partial index now covers exactly PROJECT snapshots:

`("projectId", "calculatedAt" DESC, "id" DESC) WHERE "scopeType" = 'PROJECT'`.

After migration, PostgreSQL selected an index-only scan. Execution fell from
120.825 ms to 1.041 ms for the same qualifying set, a 99.1% reduction. The
local index footprint was 32 KiB. The trade-off is one additional partial
index update for each inserted project-level readiness snapshot; work-package
snapshots do not enter it.

The management dashboard now pages authorized projects first and then reads
one newest snapshot for each selected project. It defaults to 20 rows and
rejects page sizes outside 1–100. Ordering remains deterministic by project
code and ID. Count and page data execute in one repeatable-read transaction so
pagination metadata describes the same authorized snapshot.

### Query bounds and timeouts

Synchronous report repository statements and the readiness management read
now execute with PostgreSQL `statement_timeout = 5000ms` scoped to their
transaction. A timeout fails the request safely through the existing error
boundary; it does not return partial report rows. Report periods remain
limited to 366 days and 12 calendar months, and source queries retain the
10,001-row overflow sentinel used to reject exports above 10,000 rows.

Projects, items, notifications, and management readiness enforce page sizes
of 1–100. Readiness history remains capped at 100 snapshots. Several
project-detail child registers still return their full project-scoped result
because changing all response contracts was not justified by the measured
sub-millisecond local plans. Those registers are a known growth risk.

### Notification worker N+1

Notification preparation previously performed a unique notification lookup,
conditional notification insert, and email-delivery upsert inside the
recipient loop. Its query count therefore grew linearly with project member
count before SMTP delivery began.

Preparation now uses duplicate-safe bulk notification creation, one bulk
notification read, duplicate-safe bulk email-delivery creation, and one bulk
delivery read. Existing database unique keys remain the idempotency boundary,
and integration coverage now exercises two recipients plus replay. SMTP sends
remain sequential by design because ambiguous concurrent external delivery
would complicate retry evidence. That external-I/O lane is the remaining
notification throughput limit.

No other material read-path N+1 was verified. Report sources, readiness
inputs, and material exceptions already use bounded bulk queries. Document
association validation and command-side line creation use bounded sequential
validation/writes; they were not changed without a measured read-path defect.

## Concurrency and data integrity

The existing allocation test launches competing allocations against the same
lot and verifies that transactional lot locking prevents over-allocation. The
receipt suite verifies idempotent posting, immutable lot creation, quantity
revalidation, and rollback when audit insertion fails. Both suites passed
after the performance changes.

Readiness pagination continues to construct its project predicate from the
authenticated principal before counting or selecting rows. Report statement
timeouts wrap already-scoped Prisma queries and do not remove supplier,
organization, permission, or object predicates. The readiness index contains
no new data and does not change uniqueness or lifecycle behavior.

KPI normalization creates a private calculation copy and does not mutate
inputs or persisted facts. Exact KPI fixture tests remained green. Worker bulk
inserts use the existing source-event/user and notification/delivery unique
keys, so concurrency and replay still fail closed into one retained artifact.

## Web bundle measurements

The pre-change built web application contained 648,793 bytes of static assets,
including 648,398 bytes across 10 chunk files. The largest chunk was 227,536
bytes. The final production build produced the same 648,793 static bytes and
648,398 chunk bytes across 10 files, with the same 227,536-byte largest chunk.
The pagination change therefore added no measured static bundle cost.

The readiness pagination UI adds only framework-native `Link` use and no
dependency. No bundle-splitting or dependency change was justified.

## Caching review

Server-side web API calls explicitly use `cache: "no-store"`. Authenticated
API responses set `Cache-Control: private, no-store`, and export proxy routes
do the same. This is appropriate for permission-sensitive, rapidly changing
readiness, notification, receiving, and report data and prevents one
principal's response from becoming another principal's cache entry.

Redis is used for coordination, short-lived locks, and worker heartbeat—not
as an authoritative data cache. No broad cache was introduced because the
measured database and calculator changes resolve the observed problems
without invalidation or tenant-isolation risk.

## Worker throughput and retry behavior

The worker uses deliberately single-flight lanes:

| Lane                      | Poll interval | Upper polling rate before work latency |
| ------------------------- | ------------: | -------------------------------------: |
| BOM import                |      1,000 ms |                        1 claimed job/s |
| Readiness event           |        250 ms |                       4 claimed jobs/s |
| Notification              |        500 ms |                       2 claimed jobs/s |
| Scheduled readiness sweep |     5 minutes |               sequential project sweep |

The representative 5,000-row BOM parse/validation completed in 96.74 ms
(about 51,700 rows/s for the CPU-only stage), and the 5,000-line readiness
calculation completed in 130.03 ms (about 38,450 lines/s). Storage, database
writes, and external SMTP are not included in those CPU-only rates.

Outbox claims use `FOR UPDATE SKIP LOCKED`; processing is idempotent and
bounded to five attempts with exponential retry and recoverable dead-letter
state. Notification logs include duration, attempt, created/sent/skipped
counts, dead-letter state, and periodic queue counts. Sequential SMTP delivery
and the one-event-per-process lane are expected bottlenecks if email volume
grows; horizontal worker concurrency requires an explicit operational test
with the target SMTP service.

## Expected operating limits

- BOM import: at most 5,000 rows, 10 MiB uploaded file, 20 MiB total
  uncompressed XLSX content, 100 archive entries, 20 columns, 2,000 characters
  per cell, and 1,000 characters for notes.
- Readiness: designed and measured for up to 5,000 released material lines per
  calculation; management list defaults to 20 and caps at 100; history caps at
  100 snapshots.
- Reports/scorecards: at most 366 days and 12 calendar months; synchronous
  sources use a 10,001-row overflow sentinel and exports reject more than
  10,000 output rows; each database statement has a 5-second timeout.
- Ordinary project/item/notification lists: maximum page size 100.
- Worker: one in-flight job per lane per worker process, with the polling
  ceilings shown above.
- Browser assets: the current application is below 1 MiB of built static
  assets in this environment; this is an observation, not a formal product
  budget.

These limits are conservative application boundaries, not a production
service-level objective. Production load testing must include realistic
network, object storage, SMTP, database concurrency, and tenant distributions.

## Known bottlenecks and residual risks

- Project-scoped ASN, receipt, purchase-order, requisition, document,
  inspection, NCR, and allocation registers are not uniformly paginated.
  Current measured local scans are fast, but response and rendering cost will
  grow with unusually large projects.
- Supplier scorecard source facts are loaded into application memory before
  calculation. The 10,000-row guards and final 1.75-second CPU measurement
  bound the current synchronous design, but larger/asynchronous analytics
  require a separately specified phase.
- SMTP delivery is sequential and external latency dominates notification
  throughput once preparation is batched.
- The scheduled readiness sweep is sequential. A large project portfolio may
  exceed the five-minute sweep interval even though event-driven calculation
  remains available.
- PostgreSQL measurements use warm local buffers and accumulated test data;
  production query plans may differ with tenant cardinality and statistics.
- No report/readiness result cache exists. This is intentional for
  authorization safety and freshness but means repeated identical report
  requests repeat calculation.

## Verification commands and results

The implementation used the following targeted commands:

- `pnpm performance:measure` — passed; final representative results were
  130.03 ms readiness, 96.74 ms BOM import, and 1,749.67 ms scorecard.
- `pnpm db:deploy` — passed; applied
  `20260728030000_phase_9b_readiness_query_index`.
- PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` — passed; final readiness portfolio
  execution was 1.041 ms using
  `readiness_snapshots_project_latest_idx`.
- API/worker/web targeted type checks — passed.
- KPI/readiness unit tests — passed.
- Worker notification, BOM import, and readiness integration tests — passed,
  3 files / 6 tests.
- Allocation and receipt integration tests — passed in the targeted combined
  run; report integration was rerun after its fixture isolation correction and
  passed, 2 tests.

- `pnpm verify` — passed in 632.6 seconds: formatting, lint, strict type
  checking, unit tests, integration tests, and all production builds. The API
  reported 33 unit files / 179 tests and 24 integration files / 104 tests, all
  passed.
- `pnpm test:authorization` — passed in 109.2 seconds: 14 API files / 53
  tests, all passed.
- `pnpm openapi:generate` and `pnpm openapi:check` — passed.
- Targeted Playwright reports/scorecard run — both test bodies passed in 10.8
  seconds or less.
- Targeted Playwright readiness run — passed its full body in 9.4 seconds
  after the test followed pagination links to its isolated fixture.

On this Windows host, each Playwright command remained alive in its
pnpm-managed web-server teardown after the test workers completed. The outer
command timed out (`exit 124`), including the final readiness run after its
body reported `ok`. This is the same runner teardown defect retained in
`SECURITY_REVIEW.md`; browser assertions are green, but the Playwright command
is not reported as a passing process exit.
