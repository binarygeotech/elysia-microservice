import net from "net"
import { encode, decode } from "@elysia-microservice/core"
import { randomUUID } from "crypto"
import { TcpClientOptions } from "./types"

export function createTcpClient(options: TcpClientOptions = {}) {
  const port = options.port ?? 4000
  const host = options.host ?? "127.0.0.1"
  
  const socket = new net.Socket()
  let buffer = Buffer.alloc(0)
  const pending = new Map<string, (v: any) => void>()

  socket.connect(port, host)

  socket.on("data", chunk => {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)])
    while (buffer.length >= 4) {
      const size = buffer.readUInt32BE(0)
      if (buffer.length < size + 4) return
      const msg = decode(buffer.subarray(0, size + 4))
      buffer = buffer.subarray(size + 4)
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)!(msg.response)
        pending.delete(msg.id)
      }
    }
  })

  return {
    async send(pattern: string, data: any) {
      const id = randomUUID()
      socket.write(encode({ id, pattern, data, isEvent: false }))
      return new Promise(resolve => pending.set(id, resolve))
    },

    async emit(pattern: string, data: any) {
      socket.write(encode({ pattern, data, isEvent: true }))
    },

    async close() {
      socket.destroy()
    },
  }
}
