import type { MicroserviceClient } from "./types";

type MethodDef =
  | { type: "send"; pattern: string }
  | { type: "emit"; pattern: string };

export type ClientSchema = Record<string, MethodDef>;

export function createClientProxy<T extends ClientSchema>(
  client: MicroserviceClient,
  schema: T
): {
  [K in keyof T]: T[K] extends { type: "send" }
    ? (data: any) => Promise<any>
    : (data: any) => Promise<void>;
} {
  const proxy: any = {};

  for (const key in schema) {
    const def = schema[key];
    proxy[key] =
      def.type === "send"
        ? (data: any) => client.send(def.pattern, data)
        : (data: any) => client.emit(def.pattern, data);
  }

  return proxy;
}
