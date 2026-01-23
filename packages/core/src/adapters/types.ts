/**
 * Base interface for all microservice adapters
 * Adapters integrate external frameworks (NestJS, etc.) with Elysia microservices
 */
export interface BaseAdapterInterface {
  /** Adapter name for identification and logging */
  name: string

  /** Initialize the adapter with the registry and optional context */
  init(registry: any, context?: any): void | Promise<void>
}

/** Adapter configuration in MicroserviceConfig */
export interface AdapterConfig {
  /** Adapter class constructor */
  class: new () => BaseAdapterInterface

  /** Optional initialization hook for setup/configuration */
  initializer?: (adapter: BaseAdapterInterface, registry: any) => void | Promise<void>
}
