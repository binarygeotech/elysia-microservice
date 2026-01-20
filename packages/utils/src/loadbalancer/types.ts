import type { ServiceEndpoint } from "../discovery/types";

export interface LoadBalancer {
  next(endpoints: ServiceEndpoint[]): ServiceEndpoint;
  reportFailure(endpoint: ServiceEndpoint): void;
}
