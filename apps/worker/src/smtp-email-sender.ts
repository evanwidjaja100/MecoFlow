import { connect as connectTcp, type Socket } from "node:net";
import { connect as connectTls, type TLSSocket } from "node:tls";

export interface EmailMessage {
  messageId: string;
  subject: string;
  text: string;
  to: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

interface SmtpConfiguration {
  connectTimeoutMs: number;
  from: string;
  host: string;
  password: string;
  port: number;
  secure: boolean;
  username: string;
}

function safeHeader(value: string): string {
  return value.replaceAll(/[\r\n]/g, " ").trim();
}

function dotStuff(value: string): string {
  return value
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

class SmtpConversation {
  private buffer = "";
  private readonly responses: string[] = [];
  private readonly waiters: Array<{
    reject: (error: Error) => void;
    resolve: (value: string) => void;
  }> = [];

  constructor(private readonly socket: Socket | TLSSocket) {
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.drain();
    });
    socket.on("error", (error: unknown) =>
      this.rejectWaiters(
        error instanceof Error ? error : new Error("SMTP_CONNECTION_ERROR"),
      ),
    );
    socket.on("close", () =>
      this.rejectWaiters(new Error("SMTP_CONNECTION_CLOSED")),
    );
  }

  private drain() {
    while (true) {
      const lines = this.buffer.split("\r\n");
      if (lines.length < 2) return;
      let consumed = 0;
      const responseLines: string[] = [];
      for (const line of lines.slice(0, -1)) {
        consumed += line.length + 2;
        responseLines.push(line);
        if (/^\d{3} /.test(line)) break;
      }
      const last = responseLines.at(-1);
      if (!last || !/^\d{3} /.test(last)) return;
      this.buffer = this.buffer.slice(consumed);
      const response = responseLines.join("\n");
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve(response);
      else this.responses.push(response);
    }
  }

  private rejectWaiters(error: Error) {
    for (const waiter of this.waiters.splice(0)) waiter.reject(error);
  }

  response(): Promise<string> {
    const response = this.responses.shift();
    if (response) return Promise.resolve(response);
    return new Promise((resolve, reject) =>
      this.waiters.push({ reject, resolve }),
    );
  }

  async expect(expected: readonly number[]): Promise<void> {
    const response = await this.response();
    const code = Number(response.slice(0, 3));
    if (!expected.includes(code)) throw new Error(`SMTP_${code || "INVALID"}`);
  }

  write(command: string) {
    this.socket.write(command);
  }
}

export class SmtpEmailSender implements EmailSender {
  constructor(private readonly configuration: SmtpConfiguration) {}

  async send(message: EmailMessage): Promise<void> {
    const socket = await this.connect();
    const conversation = new SmtpConversation(socket);
    try {
      await conversation.expect([220]);
      conversation.write("EHLO mecoflow.local\r\n");
      await conversation.expect([250]);
      if (this.configuration.username) {
        conversation.write("AUTH LOGIN\r\n");
        await conversation.expect([334]);
        conversation.write(
          `${Buffer.from(this.configuration.username).toString("base64")}\r\n`,
        );
        await conversation.expect([334]);
        conversation.write(
          `${Buffer.from(this.configuration.password).toString("base64")}\r\n`,
        );
        await conversation.expect([235]);
      }
      conversation.write(`MAIL FROM:<${this.configuration.from}>\r\n`);
      await conversation.expect([250]);
      conversation.write(`RCPT TO:<${safeHeader(message.to)}>\r\n`);
      await conversation.expect([250, 251]);
      conversation.write("DATA\r\n");
      await conversation.expect([354]);
      const body = [
        `From: <${this.configuration.from}>`,
        `To: <${safeHeader(message.to)}>`,
        `Subject: ${safeHeader(message.subject)}`,
        `Message-ID: <${safeHeader(message.messageId)}>`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        dotStuff(message.text),
        ".",
        "",
      ].join("\r\n");
      conversation.write(body);
      await conversation.expect([250]);
      conversation.write("QUIT\r\n");
      await conversation.expect([221]);
    } finally {
      socket.end();
    }
  }

  private connect(): Promise<Socket | TLSSocket> {
    return new Promise((resolve, reject) => {
      const options = {
        host: this.configuration.host,
        port: this.configuration.port,
        timeout: this.configuration.connectTimeoutMs,
      };
      const socket = this.configuration.secure
        ? connectTls({ ...options, servername: this.configuration.host })
        : connectTcp(options);
      const fail = (error: Error) => {
        socket.destroy();
        reject(error);
      };
      socket.once("error", fail);
      socket.once("timeout", () => fail(new Error("SMTP_TIMEOUT")));
      socket.once(
        this.configuration.secure ? "secureConnect" : "connect",
        () => {
          socket.off("error", fail);
          socket.setTimeout(this.configuration.connectTimeoutMs, () =>
            socket.destroy(new Error("SMTP_TIMEOUT")),
          );
          resolve(socket);
        },
      );
    });
  }
}
