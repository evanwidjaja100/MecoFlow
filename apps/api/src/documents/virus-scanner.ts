import { createConnection } from "node:net";
import { Inject, Injectable } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

export type VirusScanResult =
  | { code: "CLEAN"; status: "CLEAN" }
  | { code: "MALWARE_DETECTED"; status: "INFECTED" }
  | { code: "SCANNER_ERROR" | "SCANNER_UNAVAILABLE"; status: "ERROR" };

export interface VirusScanner {
  scan(body: Buffer): Promise<VirusScanResult>;
}

export const VIRUS_SCANNER = Symbol("VIRUS_SCANNER");

@Injectable()
export class ClamAvVirusScanner implements VirusScanner {
  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
  ) {}

  async scan(body: Buffer): Promise<VirusScanResult> {
    if (!this.environment.VIRUS_SCANNER_ENABLED)
      return { code: "SCANNER_UNAVAILABLE", status: "ERROR" };

    return new Promise((resolve) => {
      const socket = createConnection({
        host: this.environment.VIRUS_SCANNER_HOST,
        port: this.environment.VIRUS_SCANNER_PORT,
      });
      let response = "";
      let settled = false;
      const finish = (result: VirusScanResult) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };
      socket.setTimeout(this.environment.VIRUS_SCANNER_TIMEOUT_MS);
      socket.once("connect", () => {
        socket.write("zINSTREAM\0");
        for (let offset = 0; offset < body.length; offset += 64 * 1024) {
          const chunk = body.subarray(offset, offset + 64 * 1024);
          const length = Buffer.allocUnsafe(4);
          length.writeUInt32BE(chunk.length);
          socket.write(length);
          socket.write(chunk);
        }
        socket.end(Buffer.alloc(4));
      });
      socket.on("data", (chunk: Buffer) => {
        response += chunk.toString("utf8");
        if (response.length > 1000)
          finish({ code: "SCANNER_ERROR", status: "ERROR" });
      });
      socket.once("end", () => {
        const normalized = response
          .replaceAll(String.fromCharCode(0), "")
          .trim();
        if (normalized.endsWith(" OK"))
          finish({ code: "CLEAN", status: "CLEAN" });
        else if (normalized.endsWith(" FOUND"))
          finish({ code: "MALWARE_DETECTED", status: "INFECTED" });
        else finish({ code: "SCANNER_ERROR", status: "ERROR" });
      });
      socket.once("error", () =>
        finish({ code: "SCANNER_UNAVAILABLE", status: "ERROR" }),
      );
      socket.once("timeout", () =>
        finish({ code: "SCANNER_UNAVAILABLE", status: "ERROR" }),
      );
    });
  }
}
