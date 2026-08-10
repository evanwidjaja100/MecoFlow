# Data-correction procedure

1. Reporter identifies the record, project/supplier scope, incorrect and expected
   values, source evidence, time, and request/correlation ID.
2. Data/process owner confirms authority and impact; administrator verifies role
   and project scope. Segregate duties for material or commercial corrections
   where operational policy requires it.
3. Use only the supported correction/revision command: project edit with expected
   version, new BOM/PO/commitment/document revision, receipt correcting entry,
   or authorized lifecycle command. Never update database rows or delete history.
4. Reconcile downstream quantities, readiness, reports, notifications, and audit.
5. A second person validates the corrected application view and retained before/
   after evidence. Link the audit/correlation ID to the correction ticket.

If no supported correction exists, freeze the affected scope, raise an incident,
and request an approved forward fix. Do not invent a manual state transition.
