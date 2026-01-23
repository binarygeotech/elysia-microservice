export function EventPattern(pattern: string) {
  return function (...args: any[]): void {
    // Legacy TS decorators: (target, key, descriptor)
    if (args.length === 3) {
      const [target, key, descriptor] = args as [any, string, PropertyDescriptor]
      if (!target.__events) target.__events = []
      target.__events.push({ pattern, method: descriptor.value, key })
      return
    }

    // Stage-3 decorators: (value, context)
    if (args.length === 2) {
      const [value, context] = args as [Function, ClassMethodDecoratorContext]
      context.addInitializer(function () {
        const target = this as any
        if (!target.__events) target.__events = []
        const key = context.name as string
        // Store the unbound method reference, not the bound version
        target.__events.push({ pattern, method: value, key })
      })
      return
    }
  }
}
