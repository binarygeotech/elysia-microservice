import tls from "tls";
import fs from "fs";
import { encode, decode, createContext } from "@elysia-microservice/core";
import { TlsTransportOptions } from "./types";

export function createTlsTransport(
  registry: any,
  options: TlsTransportOptions
) {
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

  const server = tls.createServer(
    {
      key,
      cert,
      ca,
      requestCert: options.requestCert ?? false,
      rejectUnauthorized: options.rejectUnauthorized ?? false,
    },
    (socket) => {
      let buffer = Buffer.alloc(0);
      socket.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
        while (buffer.length >= 4) {
          const size = buffer.readUInt32BE(0);
          if (buffer.length < size + 4) return;
          const packet = decode(buffer.subarray(0, size + 4));
          buffer = buffer.subarray(size + 4);
          handle(packet, socket);
        }
      });

      async function handle(packet: any, socket: any) {
        const ctx = createContext(socket, packet);
        if (packet.isEvent) {
          try {
            await registry.resolveAndRunEvent(packet.pattern, packet.data, { meta: packet.meta, store: ctx });
          } catch (e: any) {
            console.warn(`[TLS Transport] Error handling event pattern: ${packet.pattern}`, e.message);
          }
          return;
        }
        try {
          const result = await registry.resolveAndRunRequest(packet.pattern, packet.data, { meta: packet.meta, store: ctx });
          socket.write(encode({ id: packet.id, response: result }));
        } catch (e: any) {
          socket.write(
            encode({ id: packet.id, error: e?.message ?? "Unknown error" })
          );
        }
      }
    }
  );

  server.listen(port, host, () => {
    console.log(`TLS microservice running on ${host}:${port}`)
  })

  return server;
}
