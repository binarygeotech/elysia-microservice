export function adaptNestMessages(controller: any, registry: any) {
  if (controller.__messages) {
    controller.__messages.forEach((m: any) => registry.registerMessage(m.pattern, m.method.bind(controller)))
  }
  if (controller.__events) {
    controller.__events.forEach((e: any) => registry.registerEvent(e.pattern, e.method.bind(controller)))
  }
}
