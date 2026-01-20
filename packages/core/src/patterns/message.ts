export function MessagePattern(pattern: string) {
  return function(target: any, key: string, descriptor: PropertyDescriptor) {
    if (!target.__messages) target.__messages = []
    target.__messages.push({ pattern, method: descriptor.value })
  }
}
