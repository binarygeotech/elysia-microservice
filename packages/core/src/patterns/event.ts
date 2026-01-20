export function EventPattern(pattern: string) {
  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    if (!target.__events) target.__events = []
    target.__events.push({ pattern, method: descriptor.value })
  }
}
