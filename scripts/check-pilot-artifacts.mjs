import { readFile } from "node:fs/promises";

const required = [
  "docs/pilot/PILOT_SCOPE.md",
  "docs/pilot/PILOT_USER_LIST.csv",
  "docs/pilot/PROJECT_SELECTION_CRITERIA.md",
  "docs/pilot/BOM_IMPORT_TEMPLATE.csv",
  "docs/pilot/SUPPLIER_ONBOARDING_GUIDE.md",
  "docs/pilot/INTERNAL_USER_GUIDE.md",
  "docs/pilot/ADMINISTRATOR_GUIDE.md",
  "docs/pilot/WAREHOUSE_QUICK_REFERENCE.md",
  "docs/pilot/QA_QC_QUICK_REFERENCE.md",
  "docs/pilot/INCIDENT_REPORTING.md",
  "docs/pilot/DATA_CORRECTION.md",
  "docs/pilot/SUPPORT_ESCALATION_MATRIX.md",
  "docs/pilot/ACCEPTANCE_TEST_SCRIPT.md",
  "docs/pilot/BASELINE_KPI_WORKSHEET.csv",
  "docs/pilot/DAILY_REVIEW_CHECKLIST.md",
  "docs/pilot/GO_LIVE_CHECKLIST.md",
  "docs/pilot/ROLLBACK_CRITERIA.md",
  "docs/pilot/POST_PILOT_EVALUATION.md",
  "docs/pilot/PILOT_DATASET.md",
];

for (const file of required) {
  const body = await readFile(file, "utf8");
  if (body.trim().length < 40)
    throw new Error(`${file} is missing substantive content`);
}

const bom = await readFile("docs/pilot/BOM_IMPORT_TEMPLATE.csv", "utf8");
if (
  !bom.startsWith("item_code,item_name,quantity,unit_code,criticality,notes\n")
)
  throw new Error(
    "Pilot BOM template does not use the documented fixed header",
  );
if (!bom.includes(",CRITICAL,") || !bom.includes(",NORMAL,"))
  throw new Error(
    "Pilot BOM template must include critical and noncritical examples",
  );

const users = await readFile("docs/pilot/PILOT_USER_LIST.csv", "utf8");
if (!users.includes("@example.invalid"))
  throw new Error(
    "Pilot user template must contain only fictional example identities",
  );

process.stdout.write(
  `Pilot artifact check passed (${required.length} files).\n`,
);
