import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  parseServiceEnvironment,
  type ServiceEnvironment,
} from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import { DocumentStorageService } from "./document-storage.service.js";
import { DocumentsRepository } from "./documents.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDependencies = databaseUrl
  ? describe.sequential
  : describe.skip;

describeWithDependencies("Phase 5A document storage integration", () => {
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  let repository: DocumentsRepository;
  let storage: DocumentStorageService;
  let s3: S3Client;
  const objectKeys: string[] = [];

  const context = {
    correlationId: "phase-5a-integration-correlation",
    requestId: "phase-5a-integration-request",
  };

  beforeAll(() => {
    environment = parseServiceEnvironment(process.env);
    database = createDatabaseClient(databaseUrl!);
    repository = new DocumentsRepository(environment);
    storage = new DocumentStorageService(environment);
    s3 = new S3Client({
      credentials: {
        accessKeyId: environment.S3_ACCESS_KEY,
        secretAccessKey: environment.S3_SECRET_KEY,
      },
      endpoint: environment.S3_ENDPOINT,
      forcePathStyle: environment.S3_FORCE_PATH_STYLE,
      region: environment.S3_REGION,
    });
  });

  afterAll(async () => {
    await Promise.all(
      objectKeys.map((Key) =>
        s3.send(
          new DeleteObjectCommand({ Bucket: environment.S3_BUCKET, Key }),
        ),
      ),
    );
    s3.destroy();
    storage.onModuleDestroy();
    await disconnectDatabaseClient();
  });

  async function uploadVersion(
    input: {
      byteSize: number;
      mimeType: string;
      sha256: string;
      storageKey: string;
    },
    body: Buffer,
  ) {
    objectKeys.push(input.storageKey);
    const signed = await storage.uploadUrl(input);
    const response = await fetch(signed.url, {
      body,
      headers: signed.headers,
      method: "PUT",
    });
    expect(response.status, await response.text()).toBe(200);
    return storage.verifiedObject({
      ...input,
      extension: "txt",
    });
  }

  it("verifies upload checksum, retains workflow history, audits access, and supersedes without overwrite", async () => {
    const body = Buffer.from(
      "MECO Flow clean document integration fixture\n",
      "utf8",
    );
    const sha256 = createHash("sha256").update(body).digest("hex");
    const storageKey = `documents/${randomUUID()}`;
    const created = await repository.create({
      actorUserId: localFixtures.internalAdminUserId,
      associations: [],
      auditOrganizationId: localFixtures.internalOrganizationId,
      category: "Certificate",
      context,
      description: "Checksum and lifecycle integration fixture",
      ownerOrganizationId: localFixtures.internalOrganizationId,
      ownerType: "INTERNAL",
      projectId: phaseTwoFixtures.demoProjectId,
      title: `Document ${randomUUID()}`,
      upload: {
        byteSize: body.length,
        extension: "txt",
        mimeType: "text/plain",
        originalFileName: "certificate.txt",
        sha256,
        storageKey,
        uploadExpiresAt: new Date(Date.now() + 300_000),
      },
    });
    const first = created.versions[0]!;
    const verified = await uploadVersion(
      { byteSize: body.length, mimeType: "text/plain", sha256, storageKey },
      body,
    );
    expect(verified.detectedMimeType).toBe("text/plain");
    const completed = await repository.complete({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      detectedMimeType: verified.detectedMimeType,
      expectedVersion: first.version,
      scanResultCode: "CLEAN",
      scanStatus: "CLEAN",
      versionId: first.id,
    });
    const reviewed = await repository.transition({
      action: "DOCUMENT_REVIEW_SUBMITTED",
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: completed.version,
      reason: "Ready for controlled review",
      targetStatus: "IN_REVIEW",
      versionId: first.id,
    });
    const approved = await repository.transition({
      action: "DOCUMENT_APPROVED",
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: reviewed.version,
      reason: "Verified certificate accepted",
      targetStatus: "APPROVED",
      versionId: first.id,
    });
    expect(approved.status).toBe("APPROVED");
    const download = await storage.downloadUrl({
      extension: first.extension,
      storageKey,
      versionNumber: 1,
    });
    expect(download.expiresInSeconds).toBe(120);
    await repository.auditDownload({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      versionId: first.id,
    });

    const replacementBody = Buffer.from(
      "MECO Flow replacement version\n",
      "utf8",
    );
    const replacementSha = createHash("sha256")
      .update(replacementBody)
      .digest("hex");
    const replacementKey = `documents/${randomUUID()}`;
    const replacement = await repository.supersede({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      documentId: created.id,
      expectedDocumentVersion: created.version,
      ownerOrganizationId: localFixtures.internalOrganizationId,
      reason: "Issue a corrected retained version",
      upload: {
        byteSize: replacementBody.length,
        extension: "txt",
        mimeType: "text/plain",
        originalFileName: "certificate-v2.txt",
        sha256: replacementSha,
        storageKey: replacementKey,
        uploadExpiresAt: new Date(Date.now() + 300_000),
      },
    });
    const replacementVerified = await uploadVersion(
      {
        byteSize: replacementBody.length,
        mimeType: "text/plain",
        sha256: replacementSha,
        storageKey: replacementKey,
      },
      replacementBody,
    );
    const replacementCompleted = await repository.complete({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      detectedMimeType: replacementVerified.detectedMimeType,
      expectedVersion: replacement.version,
      scanResultCode: "CLEAN",
      scanStatus: "CLEAN",
      versionId: replacement.id,
    });
    const replacementReviewed = await repository.transition({
      action: "DOCUMENT_REVIEW_SUBMITTED",
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: replacementCompleted.version,
      reason: "Corrected version is ready for review",
      targetStatus: "IN_REVIEW",
      versionId: replacement.id,
    });
    await repository.transition({
      action: "DOCUMENT_APPROVED",
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: replacementReviewed.version,
      reason: "Corrected version approved and prior version superseded",
      targetStatus: "APPROVED",
      versionId: replacement.id,
    });

    const versions = await database.documentVersion.findMany({
      orderBy: { versionNumber: "asc" },
      where: { documentId: created.id },
    });
    expect(versions.map(({ status }) => status)).toEqual([
      "SUPERSEDED",
      "APPROVED",
    ]);
    await expect(
      database.documentVersion.update({
        data: { originalFileName: "overwritten.txt" },
        where: { id: replacement.id },
      }),
    ).rejects.toThrow();
    const actions = await database.auditEvent.findMany({
      select: { action: true },
      where: { entityId: { in: [first.id, replacement.id] } },
    });
    expect(actions.map(({ action }) => action)).toEqual(
      expect.arrayContaining([
        "DOCUMENT_UPLOAD_INITIATED",
        "DOCUMENT_UPLOAD_COMPLETED",
        "DOCUMENT_APPROVED",
        "DOCUMENT_DOWNLOADED",
      ]),
    );
  });

  it("fails closed when stored bytes do not match the declared checksum", async () => {
    const expected = Buffer.from("expected");
    const actual = Buffer.from("tampered");
    const sha256 = createHash("sha256").update(expected).digest("hex");
    const storageKey = `documents/${randomUUID()}`;
    objectKeys.push(storageKey);
    await s3.send(
      new PutObjectCommand({
        Body: actual,
        Bucket: environment.S3_BUCKET,
        ContentLength: actual.length,
        ContentType: "text/plain",
        Key: storageKey,
        Metadata: { sha256 },
      }),
    );
    await expect(
      storage.verifiedObject({
        byteSize: actual.length,
        extension: "txt",
        mimeType: "text/plain",
        sha256,
        storageKey,
      }),
    ).rejects.toThrow("OBJECT_CHECKSUM_MISMATCH");
  });

  it("serializes competing review decisions and audits the single rejection", async () => {
    const body = Buffer.from("document awaiting rejection decision\n", "utf8");
    const sha256 = createHash("sha256").update(body).digest("hex");
    const storageKey = `documents/${randomUUID()}`;
    const created = await repository.create({
      actorUserId: localFixtures.internalAdminUserId,
      associations: [],
      auditOrganizationId: localFixtures.internalOrganizationId,
      category: "Test evidence",
      context,
      description: "Concurrent decision fixture",
      ownerOrganizationId: localFixtures.internalOrganizationId,
      ownerType: "INTERNAL",
      projectId: phaseTwoFixtures.demoProjectId,
      title: `Reject document ${randomUUID()}`,
      upload: {
        byteSize: body.length,
        extension: "txt",
        mimeType: "text/plain",
        originalFileName: "reject.txt",
        sha256,
        storageKey,
        uploadExpiresAt: new Date(Date.now() + 300_000),
      },
    });
    const version = created.versions[0]!;
    const verified = await uploadVersion(
      { byteSize: body.length, mimeType: "text/plain", sha256, storageKey },
      body,
    );
    const completed = await repository.complete({
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      detectedMimeType: verified.detectedMimeType,
      expectedVersion: version.version,
      scanResultCode: "CLEAN",
      scanStatus: "CLEAN",
      versionId: version.id,
    });
    const reviewed = await repository.transition({
      action: "DOCUMENT_REVIEW_SUBMITTED",
      actorUserId: localFixtures.internalAdminUserId,
      auditOrganizationId: localFixtures.internalOrganizationId,
      context,
      expectedVersion: completed.version,
      reason: "Ready for concurrent decision test",
      targetStatus: "IN_REVIEW",
      versionId: version.id,
    });
    const decisions = await Promise.allSettled(
      ["first", "second"].map((label) =>
        repository.transition({
          action: "DOCUMENT_REJECTED",
          actorUserId: localFixtures.internalAdminUserId,
          auditOrganizationId: localFixtures.internalOrganizationId,
          context: { ...context, requestId: `${context.requestId}-${label}` },
          expectedVersion: reviewed.version,
          reason: `Rejected by ${label} concurrent decision`,
          targetStatus: "REJECTED",
          versionId: version.id,
        }),
      ),
    );
    expect(
      decisions.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      decisions.filter(({ status }) => status === "rejected"),
    ).toHaveLength(1);
    expect(
      await database.auditEvent.count({
        where: { action: "DOCUMENT_REJECTED", entityId: version.id },
      }),
    ).toBe(1);
    expect(
      (
        await database.documentVersion.findUniqueOrThrow({
          where: { id: version.id },
        })
      ).status,
    ).toBe("REJECTED");
  });
});
