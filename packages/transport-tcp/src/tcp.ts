import net from "net"
import { encode, decode, createContext } from "@elysia-microservice/core"
import { TcpTransportOptions } from "./types"

export function createTcpTransport(registry: any, options: TcpTransportOptions = {}) {
  const port = options.port ?? 4000
  const host = options.host ?? "127.0.0.1"

  const server = net.createServer(socket => {
    let buffer = Buffer.alloc(0)
    socket.on("data", chunk => {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)])
      while (buffer.length >= 4) {
        const size = buffer.readUInt32BE(0)
        if (buffer.length < size + 4) return
        const packet = decode(buffer.subarray(0, size + 4))
        buffer = buffer.subarray(size + 4)
        handle(packet, socket)
      }
    })

    async function handle(packet: any, socket: any) {
      const ctx = createContext(socket, packet)
      if (packet.isEvent) {
        try {
          await registry.resolveAndRunEvent(packet.pattern, packet.data, { meta: packet.meta, store: ctx })
        } catch (e: any) {
          console.warn(`[TCP Transport] Error handling event pattern: ${packet.pattern}`, e.message)
        }
        return
      }
      try {
        const result = await registry.resolveAndRunRequest(packet.pattern, packet.data, { meta: packet.meta, store: ctx })
        socket.write(encode({ id: packet.id, response: result }))
      } catch (e: any) {
        socket.write(encode({ id: packet.id, error: e?.message ?? "Unknown error" }))
      }
    }
  })

  server.listen(port, host, () => {
    console.log(`TCP microservice running on ${host}:${port}`)
  })

  return server
}
