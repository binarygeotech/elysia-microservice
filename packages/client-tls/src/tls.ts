import tls from "tls";
import fs from "fs";
import { encode, decode } from "@elysia-microservice/core";
import { randomUUID } from "crypto";
import { TlsClientOptions } from "./types";

export function createTlsClient(options: TlsClientOptions) {
  const port = options.port ?? 4001;
  const host = options.host ?? "127.0.0.1";

  // Read key/cert buffers if given as file paths
  const key =
    typeof options.key === "string"
      ? fs.readFileSync(options.key)
      : options.key;
  const cert =
    typeof options.cert === "string"
      ? fs.readFileSync(options.cert)
      : options.cert;
  const ca = options.ca
    ? typeof options.ca === "string"
      ? fs.readFileSync(options.ca)
      : options.ca
    : undefined;

  const socket = tls.connect({
    host: host,
    port: port,
    key,
    cert,
    ca,
    rejectUnauthorized: options.rejectUnauthorized ?? false,
  });

  let buffer = Buffer.alloc(0);
  const pending = new Map<string, (v: any) => void>();

  socket.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 4) {
      const size = buffer.readUInt32BE(0);
      if (buffer.length < size + 4) return;
      const msg = decode(buffer.subarray(0, size + 4));
      buffer = buffer.subarray(size + 4);

      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)!(msg.response);
        pending.delete(msg.id);
      }
    }
  });

  return {
    async send(pattern: string, data: any) {
      const id = randomUUID();
      socket.write(encode({ id, pattern, data, isEvent: false }));
      return new Promise((resolve) => pending.set(id, resolve));
    },

    async emit(pattern: string, data: any) {
      socket.write(encode({ pattern, data, isEvent: true }));
    },

    async close() {
      socket.destroy();
    },
  };
}
