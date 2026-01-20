export function withResilience<T extends object>(
  client: T,
  options: {
    retries?: number
    timeout?: number
    breakerThreshold?: number
  } = {}
): T {
  let failures = 0
  let open = false

  const {
    retries = 3,
    timeout = 3000,
    breakerThreshold = 5,
  } = options

  async function exec(fn: Function, args: any[]) {
    if (open) throw new Error("Circuit breaker open")

    for (let i = 0; i <= retries; i++) {
      try {
        return await Promise.race([
          fn(...args),
          new Promise((_, r) =>
            setTimeout(() => r(new Error("Timeout")), timeout)
          ),
        ])
      } catch (e) {
        failures++
        if (failures >= breakerThreshold) open = true
        if (i === retries) throw e
      }
    }
  }

  return new Proxy(client, {
    get(target, prop) {
      const fn = (target as any)[prop]
      if (typeof fn !== "function") return fn
      return (...args: any[]) => exec(fn, args)
    },
  })
}
