# Warehouse quick reference

1. Open the assigned project’s **Shipments and receiving** workspace.
2. Match supplier, PO, ASN reference, package, and physical arrival; record arrival.
3. Create a draft receipt using actual received quantities, timestamp, location,
   heat/batch/manufacturer, and package references. Partial quantity is expected;
   never enter the ordered quantity unless physically received.
4. Recheck every line, then post once. Posting is immutable and creates lots.
5. Open the required inspection for each awaiting-inspection lot. Do not move
   quarantined/rejected material into available stock.
6. For an error, do not edit the posted receipt: request a correcting entry under
   `DATA_CORRECTION.md`.

Stop and report: duplicate ASN/receipt, unexpected quantity, wrong supplier or
project, missing traceability, damaged material, security incident, or a posted
receipt without the expected inventory/audit effect.
