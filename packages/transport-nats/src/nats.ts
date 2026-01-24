import { connect } from "nats"
import { NatsTransportOptions } from "./types"

export async function createNatsTransport(registry: any, options: NatsTransportOptions = {}) {
  const nc = await connect({ ...options })

  // Note: NATS subscriptions are pattern-based, so we subscribe to registered patterns
  // Wildcard matching happens at NATS level (e.g., "users.*" subscription in NATS)
  // Subscribe to all registered request patterns
  const requestPatterns = registry.getRequestPatterns()
  for (const pattern of requestPatterns) {
    const sub = nc.subscribe(pattern)
    ;(async () => {
      for await (const msg of sub) {
        try {
          const { id, data, meta } = JSON.parse(new TextDecoder().decode(msg.data))
          const result = await registry.resolveAndRunRequest(msg.subject || pattern, data, { meta })
          if (msg.reply) {
            nc.publish(msg.reply, new TextEncoder().encode(JSON.stringify(result)))
          }
        } catch (e: any) {
          console.warn(`[NATS Transport] Error handling request:`, e.message)
          if (msg.reply) {
            nc.publish(msg.reply, new TextEncoder().encode(JSON.stringify({ error: e.message })))
          }
        }
      }
    })()
  }

  // Subscribe to all registered event patterns
  const eventPatterns = registry.getEventPatterns()
  for (const pattern of eventPatterns) {
    const sub = nc.subscribe(pattern)
    ;(async () => {
      for await (const msg of sub) {
        try {
          const { data, meta } = JSON.parse(new TextDecoder().decode(msg.data))
          await registry.resolveAndRunEvent(msg.subject || pattern, data, { meta })
        } catch (e: any) {
          console.warn(`[NATS Transport] Error handling event:`, e.message)
        }
      }
    })()
  }

  console.log(`NATS microservice connected to ${options.url ?? "nats://localhost:4222"}`)

  return nc
}
