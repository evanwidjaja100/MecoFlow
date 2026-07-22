import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  detectDocumentMimeType,
  MAX_DOCUMENT_BYTES,
  validateDocumentMetadata,
} from "./document-file-validation.js";

const checksum = createHash("sha256").update("test").digest("hex");

describe("document file security", () => {
  it("accepts only matched allowlisted metadata", () => {
    expect(
      validateDocumentMetadata({
        byteSize: 100,
        fileName: "certificate.pdf",
        mimeType: "application/pdf",
        sha256: checksum,
      }),
    ).toMatchObject({ extension: "pdf", mimeType: "application/pdf" });
  });

  it.each([
    ["archive.zip", "application/zip", 100, checksum],
    ["document.pdf", "application/zip", 100, checksum],
    ["../document.pdf", "application/pdf", 100, checksum],
    ["document.pdf", "application/pdf", MAX_DOCUMENT_BYTES + 1, checksum],
    ["document.pdf", "application/pdf", 100, "0".repeat(63)],
  ])(
    "rejects unsafe metadata for %s",
    (fileName, mimeType, byteSize, sha256) => {
      expect(() =>
        validateDocumentMetadata({ byteSize, fileName, mimeType, sha256 }),
      ).toThrow();
    },
  );

  it("detects supported magic and UTF-8 text", () => {
    expect(detectDocumentMimeType(Buffer.from("%PDF-1.7\n%%EOF"), "pdf")).toBe(
      "application/pdf",
    );
    expect(
      detectDocumentMimeType(
        Buffer.concat([
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
          Buffer.from("payload"),
        ]),
        "png",
      ),
    ).toBe("image/png");
    expect(detectDocumentMimeType(Buffer.from("a,b\n1,2\n"), "csv")).toBe(
      "text/csv",
    );
  });

  it.each([
    [Buffer.from([0x50, 0x4b, 0x03, 0x04, 1]), "txt"],
    [Buffer.from("MZ executable"), "txt"],
    [Buffer.from([0, 1, 2]), "txt"],
    [Buffer.from("not a pdf"), "pdf"],
  ] as const)(
    "rejects ZIP, executables, binary text, and masquerades",
    (body, extension) => {
      expect(() => detectDocumentMimeType(body, extension)).toThrow();
    },
  );
});
