import { basename } from "node:path";
import { TextDecoder } from "node:util";
import { UnprocessableEntityException } from "@nestjs/common";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = {
  csv: new Set(["application/csv", "text/csv"]),
  jpeg: new Set(["image/jpeg"]),
  jpg: new Set(["image/jpeg"]),
  pdf: new Set(["application/pdf"]),
  png: new Set(["image/png"]),
  txt: new Set(["text/plain"]),
} as const;

export type AllowedDocumentExtension = keyof typeof allowedMimeTypes;

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

export function validateDocumentMetadata(input: {
  byteSize: number;
  fileName: string;
  mimeType: string;
  sha256: string;
}): {
  byteSize: number;
  extension: AllowedDocumentExtension;
  mimeType: string;
  originalFileName: string;
  sha256: string;
} {
  const normalizedName = basename(input.fileName.replace(/\\/g, "/"));
  if (
    normalizedName !== input.fileName ||
    normalizedName.startsWith(".") ||
    normalizedName.length > 255 ||
    hasControlCharacter(normalizedName)
  )
    throw new UnprocessableEntityException("Unsafe file name");
  const extension = normalizedName.split(".").pop()?.toLowerCase();
  if (!extension || !(extension in allowedMimeTypes))
    throw new UnprocessableEntityException("File extension is not allowed");
  const typedExtension = extension as AllowedDocumentExtension;
  const mimeType = input.mimeType.toLowerCase().split(";", 1)[0]?.trim() ?? "";
  if (!allowedMimeTypes[typedExtension].has(mimeType))
    throw new UnprocessableEntityException(
      "Declared MIME type does not match the file extension",
    );
  if (
    !Number.isInteger(input.byteSize) ||
    input.byteSize < 1 ||
    input.byteSize > MAX_DOCUMENT_BYTES
  )
    throw new UnprocessableEntityException("Invalid or oversized upload");
  if (!/^[0-9a-f]{64}$/.test(input.sha256))
    throw new UnprocessableEntityException("Invalid SHA-256 checksum");
  return {
    byteSize: input.byteSize,
    extension: typedExtension,
    mimeType,
    originalFileName: normalizedName,
    sha256: input.sha256,
  };
}

function isZip(body: Buffer): boolean {
  return (
    body.length >= 4 &&
    (body.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) ||
      body.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x05, 0x06])) ||
      body.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x07, 0x08])))
  );
}

export function detectDocumentMimeType(
  body: Buffer,
  extension: AllowedDocumentExtension,
): string {
  if (body.length === 0 || body.length > MAX_DOCUMENT_BYTES || isZip(body))
    throw new UnprocessableEntityException("Unsafe or invalid file content");
  if (body.subarray(0, 2).equals(Buffer.from("MZ")))
    throw new UnprocessableEntityException("Executable content is not allowed");

  if (extension === "pdf") {
    if (!body.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw new UnprocessableEntityException("File content is not a PDF");
    return "application/pdf";
  }
  if (extension === "png") {
    if (
      !body
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      throw new UnprocessableEntityException("File content is not a PNG image");
    return "image/png";
  }
  if (extension === "jpg" || extension === "jpeg") {
    if (
      body.length < 4 ||
      body[0] !== 0xff ||
      body[1] !== 0xd8 ||
      body.at(-2) !== 0xff ||
      body.at(-1) !== 0xd9
    )
      throw new UnprocessableEntityException(
        "File content is not a JPEG image",
      );
    return "image/jpeg";
  }

  if (body.includes(0))
    throw new UnprocessableEntityException("Binary content is not allowed");
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new UnprocessableEntityException("Text content is not valid UTF-8");
  }
  return extension === "csv" ? "text/csv" : "text/plain";
}
