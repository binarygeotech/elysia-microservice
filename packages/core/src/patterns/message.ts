const PARAMS_META = Symbol.for("ms:parammeta")

export type ParamMeta =
  | { type: "payload"; index: number; path?: string }
  | { type: "ctx"; index: number }
  | { type: "app"; index: number, resource?: string }

function addParamMeta(target: any, key: string | symbol, meta: ParamMeta) {
  const store = target[PARAMS_META] || (target[PARAMS_META] = {})
  const list = store[key] || (store[key] = [])
  list.push(meta)
}

export function Payload(path?: string) {
  return function (target: any, key: string | symbol, index: number) {
    addParamMeta(target, key, { type: "payload", index, path })
  }
}

export function Ctx() {
  return function (target: any, key: string | symbol, index: number) {
    addParamMeta(target, key, { type: "ctx", index })
  }
}

export function App(resource?: string) {
  return function (target: any, key: string | symbol, index: number) {
    addParamMeta(target, key, { type: "app", index, resource })
  }
}

export function MessagePattern(pattern: string) {
  return function (...args: any[]): void {
    // Legacy TS decorators: (target, key, descriptor)
    if (args.length === 3) {
      const [target, key, descriptor] = args as [any, string, PropertyDescriptor]
      if (!target.__messages) target.__messages = []
      target.__messages.push({ pattern, method: descriptor.value, key })
      return
    }

    // Stage-3 decorators: (value, context)
    if (args.length === 2) {
      const [value, context] = args as [Function, ClassMethodDecoratorContext]
      context.addInitializer(function () {
        const target = this as any
        if (!target.__messages) target.__messages = []
        // Stage-3 provides name on context
        const key = context.name as string
        // Store the unbound method reference, not the bound version
        target.__messages.push({ pattern, method: value, key })
      })
      return
    }
  }
}

export { PARAMS_META }
