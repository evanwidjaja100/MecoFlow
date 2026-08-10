# Document API

Phase 5A provides project-scoped private document metadata and immutable numbered file versions. Phase 5B extends validated associations to advance shipment notices and goods receipts without adding a second file-storage path. Phase 6A adds internal receiving-inspection evidence associations. NCR, allocation, and readiness records remain absent.

## Security and storage

Allowed extensions are `.pdf`, `.png`, `.jpg`, `.jpeg`, `.txt`, and `.csv`, with a 10 MiB maximum. ZIP and ZIP-based office formats are not allowed. Initiation validates a safe basename, extension, declared MIME type, exact integer size, and lowercase SHA-256. The API generates an extension-free opaque object key and a five-minute private S3 PUT URL bound to size, content type, SHA-256, private bucket, and production server-side encryption.

Completion re-reads the authoritative private object, checks stored metadata and length, computes SHA-256 independently, detects supported magic/UTF-8 content, rejects ZIP/executable/binary masquerades, and invokes the `VirusScanner` interface. The default adapter speaks ClamAV `INSTREAM`; disabled, unavailable, malformed, timed-out, or positive scans fail closed as `SCAN_FAILED`. Production configuration is rejected when virus scanning is disabled.

Only `CLEAN` versions in `IN_REVIEW` or `APPROVED` can receive a two-minute private download URL. Review downloads require internal review permission. Normal readers and suppliers can download only approved clean content. URL issuance is CSRF protected and audited; storage keys are absent from JSON and audit changes.

## Routes

| Route                                                 | Policy                                                                                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/projects/{projectId}/documents`          | Project read plus internal `document.read`, or own-supplier `supplier.document.read`; supplier results are owner-organization filtered |
| `POST /api/v1/projects/{projectId}/documents/uploads` | CSRF, project write plus `document.upload`, or supplier project read plus `supplier.document.upload`                                   |
| `GET /api/v1/documents/{documentId}`                  | Same read policy with protected-object re-scope and inaccessible/nonexistent equivalence                                               |
| `POST /api/v1/documents/{documentId}/supersede`       | CSRF, owner organization, upload policy, expected document version, and current approved version                                       |
| `POST /api/v1/document-versions/{versionId}/complete` | CSRF, owner organization, upload policy, expected version, unexpired session, object/checksum/type/scan verification                   |
| `POST .../{versionId}/submit-review`                  | CSRF, owner organization, upload policy, expected version, clean current draft                                                         |
| `POST .../{versionId}/approve`                        | CSRF, internal `document.approve`, project write, expected version, clean current review version                                       |
| `POST .../{versionId}/reject`                         | Same approval policy and review preconditions                                                                                          |
| `POST .../{versionId}/download-url`                   | CSRF, authorized clean approved read or clean internal review read; audited two-minute URL                                             |

All unsafe DTOs reject unknown fields. Upload, completion, review, approval, rejection, supersede, and download actions use explicit command routes rather than arbitrary status mutation.

## Lifecycle and integrity

New versions begin `QUARANTINED/PENDING`. Successful checksum, content, and malware verification moves them to `DRAFT/CLEAN`; any scan or verification failure moves them to `SCAN_FAILED` and leaves them non-downloadable. The command lifecycle is `DRAFT -> IN_REVIEW -> APPROVED|REJECTED`. Creating a supersede upload appends a new numbered quarantined version; approving it atomically changes the prior approved version to `SUPERSEDED`.

Database triggers reject non-quarantined inserts, invalid status or scan transitions, file-metadata changes, approved-version changes other than supersede, version/association/history deletion, and history updates. Version predicates and row locks serialize completion, review decisions, and replacement approval.

Phase 5B supplier documents may associate with an `ADVANCE_SHIPMENT_NOTICE` only when the ASN project and supplier organization equal the document scope. `GOODS_RECEIPT` associations are internal-only. Packing lists, certificates, and receipt photographs therefore inherit the same private storage, scanning, workflow, owner filtering, and download authorization as every other document.

Phase 6A `RECEIVING_INSPECTION` associations are internal-only and must resolve to an inspection in the same project as the document. A certificate check can reference only the current `APPROVED` and `CLEAN` version of a document carrying that exact inspection association. Upload, association, or certificate selection alone never changes scan state, document approval, inspection disposition, or lot availability.
