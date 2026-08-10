# Reproducible pilot dataset

## Safety and creation

The dataset is fictional, staging-only, and contains no credentials or real
personal/commercial data. Prepare the normal staging smoke identities first,
then run:

```powershell
pnpm staging:pilot-acceptance
```

The guarded `pilot-prepare` job refuses any environment except
`APP_ENV=staging` with `STAGING_PILOT_FIXTURES=true`. It idempotently provisions
four draft projects (`PILOT-2027-01` through `PILOT-2027-04`), ten fictional or
representative supplier organizations, an EA unit, two fictional items, a
required certificate check, and a required visual check. It never updates an
existing project state. The browser acceptance script moves projects through
DRAFT -> PLANNED -> ACTIVE using the authenticated transition command and
creates workflow data through ordinary application routes.

## Expected scenario inventory

| Scenario            | Expected evidence                                                   |
| ------------------- | ------------------------------------------------------------------- |
| Active projects     | Four active pilot project overviews and retained transitions        |
| Suppliers           | Ten active supplier organizations; Supplier A/B are interactive     |
| BOM                 | Released revision with `PILOT-VALVE-CRIT` and `PILOT-GASKET-STD`    |
| Partial delivery    | ASN/receipt for 6 of 10 valves and 2 of 4 gaskets                   |
| Certificate         | Open critical-valve inspection requiring approved clean evidence    |
| Inspection          | Standard-gasket result recorded as nonconforming                    |
| Quarantine/NCR      | Quarantined gasket lot, issued NCR, retained supplier response      |
| Readiness/reporting | Internal management readiness and report surfaces load              |
| Isolation           | Supplier A/B own-project success and foreign/missing equivalent 404 |

Re-running appends new traceable acceptance transactions but does not erase or
rewrite history. Use a fresh staging namespace for formal evidence. Record the
app version, schema migration count, namespace, start/end timestamps, and test
report identifier in the go-live checklist.
