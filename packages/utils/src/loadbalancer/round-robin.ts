export class RoundRobinBalancer {
  private index = 0
  private failures = new Map<string, number>()

  next(endpoints: any[]) {
    const healthy = endpoints.filter(e => (this.failures.get(JSON.stringify(e)) ?? 0) < 3)
    const list = healthy.length ? healthy : endpoints
    const ep = list[this.index++ % list.length]
    return ep
  }

  reportFailure(endpoint: any) {
    const key = JSON.stringify(endpoint)
    this.failures.set(key, (this.failures.get(key) ?? 0) + 1)
  }
}
