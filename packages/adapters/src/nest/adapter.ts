import type { BaseAdapterInterface } from "@elysia-microservice/core";

const PARAMS_META = Symbol.for("ms:parammeta");

function buildHandler(controller: any, entry: any) {
  const proto = Object.getPrototypeOf(controller);
  const store = controller[PARAMS_META] || proto?.[PARAMS_META] || {};
  const params: any[] = store?.[entry.key] || [];
  
  // Bind the method to the controller instance
  const boundMethod = entry.method.bind(controller);
  
  if (!params.length) return boundMethod;

  const maxIndex = Math.max(...params.map((p) => p.index));

  return async (ctx: any) => {
    const args = new Array(Math.max(maxIndex + 1, entry.method.length)).fill(undefined);
    for (const meta of params) {
      if (meta.type === "payload") {
        args[meta.index] = meta.path ? ctx?.data?.[meta.path] : ctx?.data;
      } else if (meta.type === "ctx") {
        args[meta.index] = ctx?.meta ?? ctx;
      } else if (meta.type === "app") {
        args[meta.index] = meta.resource? ctx?.[meta.resource] : ctx;
      }
    }
    // If no params filled (edge), fall back to data
    const filled = args.some((v) => v !== undefined);
    return boundMethod.apply(undefined, filled ? args : [ctx?.data]);
  };
}

export function adaptNestMessages(controller: any, registry: any) {
  if (controller.__messages) {
    controller.__messages.forEach((m: any) => registry.registerMessage(m.pattern, buildHandler(controller, m)))
  }
  if (controller.__events) {
    controller.__events.forEach((e: any) => registry.registerEvent(e.pattern, buildHandler(controller, e)))
  }
}

/**
 * NestJS Adapter for Elysia Microservices
 * Integrates NestJS-style decorators (@MessagePattern, @EventPattern) with Elysia
 */
export class NestAdapter implements BaseAdapterInterface {
  name = "NestAdapter";

  /**
   * Initialize the adapter with a controller instance and registry
   * The controller should have @MessagePattern and @EventPattern decorated methods
   */
  init(registry: any, controller?: any): void {
    if (!controller) {
      throw new Error("NestAdapter requires a controller instance");
    }

    if (controller.__messages) {
      controller.__messages.forEach((m: any) =>
        registry.registerMessage(m.pattern, buildHandler(controller, m))
      );
    }
    if (controller.__events) {
      controller.__events.forEach((e: any) =>
        registry.registerEvent(e.pattern, buildHandler(controller, e))
      );
    }
  }
}
