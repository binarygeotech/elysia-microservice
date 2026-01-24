import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { Microservice } from "../src";
import type { MessageContext, GuardFunction, Middleware } from "../src/types";
import { createTcpTransport } from "@elysia-microservice/transport-tcp";
import { createClient } from "@elysia-microservice/client-base";

describe("DI System - Guards, Middleware, and Groups", () => {
  let app: any;
  let server: any;
  let client: any;

  beforeAll(async () => {
    app = new Elysia()
      .use(
        Microservice({
          server: { transport: "tcp", options: { port: 5555 } },
        })
      )
      .onMsMessage("users.get", async (ctx) => {
        return { id: 1, name: "John", data: ctx.data };
      });

    // Add global guard
    app.msGuard(async (ctx) => {
      // Check if user is authenticated
      if (!ctx.meta || !(ctx.meta as any).token) {
        throw new Error("Unauthorized: No token provided");
      }
    });

    // Add global middleware that enriches context
    app.msMiddleware({
      onBefore: async (ctx) => {
        const now = new Date().toISOString();
        return { requestTime: now, enrichedFlag: true };
      },
      onAfter: async (ctx, response) => {
        // Log after handler
        console.log(`[${ctx.pattern}] completed at`, new Date().toISOString());
      },
    });

    // Create user group with role-based guards
    const userGroup = app.msGroup("users.*");
    userGroup.msGuard(async (ctx) => {
      if (!((ctx.meta as any)?.role === "admin" || (ctx.meta as any)?.role === "user")) {
        throw new Error("Forbidden: Invalid role");
      }
    });

    userGroup.msMiddleware({
      onBefore: async (ctx) => {
        return { userGroupContext: true };
      },
    });

    // Create product group with different guards
    const productGroup = app.msGroup("products.*");
    productGroup.msGuard(async (ctx) => {
      if (!((ctx.meta as any)?.role === "admin")) {
        throw new Error("Forbidden: Only admins can access products");
      }
    });

    await app.microservice.start();
    await app.microservice.awaitReady();

    client = await createClient({
      transport: "tcp",
      options: { host: "127.0.0.1", port: 5555 },
    } as any);
  });

  afterAll(async () => {
    if (client?.close) await client.close();
    await app.microservice.stop();
  });

  it("should block request without token (global guard)", async () => {
    try {
      await client.send("users.get", { name: "test" }, { meta: {} });
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err.message).toContain("Unauthorized");
    }
  });

  it("should allow request with valid token (global guard passes)", async () => {
    const result = await client.send("users.get", { name: "test" }, { meta: { token: "valid-token", role: "user" } });
    expect(result).toMatchObject({ id: 1, name: "John" });
  });

  it("should block user pattern with invalid role (group guard)", async () => {
    try {
      await client.send("users.get", { name: "test" }, { meta: { token: "valid-token", role: "guest" } });
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err.message).toContain("Forbidden: Invalid role");
    }
  });

  it("should allow user pattern with admin role (group guard passes)", async () => {
    const result = await client.send("users.get", { name: "test" }, { meta: { token: "valid-token", role: "admin" } });
    expect(result).toMatchObject({ id: 1, name: "John" });
  });

  it("should block product pattern without admin role (product group guard)", async () => {
    app.onMsMessage("products.list", async (ctx) => {
      return { products: [] };
    });

    try {
      await client.send("products.list", {}, { meta: { token: "valid-token", role: "user" } });
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err.message).toContain("Forbidden: Only admins");
    }
  });

  it("should allow product pattern with admin role (product group guard passes)", async () => {
    const result = await client.send("products.list", {}, { meta: { token: "valid-token", role: "admin" } });
    expect(result).toMatchObject({ products: [] });
  });

  it("middleware should enrich context with requestTime", async () => {
    app.onMsMessage("echo.test", async (ctx: any) => {
      return {
        received: ctx.data,
        requestTime: ctx.requestTime,
        enrichedFlag: ctx.enrichedFlag,
        userGroupContext: ctx.userGroupContext || false,
      };
    });

    const result = await client.send("echo.test", { test: "data" }, { meta: { token: "valid-token", role: "user" } });
    expect(result.requestTime).toBeDefined();
    expect(result.enrichedFlag).toBe(true);
    expect(typeof result.requestTime).toBe("string");
  });

  it("user group middleware should enrich context", async () => {
    app.onMsMessage("users.context", async (ctx: any) => {
      return {
        hasUserGroupContext: !!ctx.userGroupContext,
      };
    });

    const result = await client.send("users.context", {}, { meta: { token: "valid-token", role: "user" } });
    expect(result.hasUserGroupContext).toBe(true);
  });

  it("should handle multiple guards execution order", async () => {
    const executionOrder: string[] = [];

    const globalGuard: GuardFunction = async (ctx) => {
      executionOrder.push("global-guard");
      if (!ctx.meta || !(ctx.meta as any).token) throw new Error("No token");
    };

    const groupGuard: GuardFunction = async (ctx) => {
      executionOrder.push("group-guard");
    };

    const app2 = new Elysia().use(
      Microservice({
        server: { transport: "tcp", options: { port: 5556 } },
      })
    );

    app2.msGuard(globalGuard);
    const testGroup = app2.msGroup("test.*");
    testGroup.msGuard(groupGuard);

    app2.onMsMessage("test.order", async (ctx) => {
      executionOrder.push("handler");
      return { order: executionOrder };
    });

    await app2.microservice.start();
    await app2.microservice.awaitReady();

    const client2 = await createClient({
      transport: "tcp",
      options: { host: "127.0.0.1", port: 5556 },
    } as any);

    const result = await client2.send("test.order", {}, { meta: { token: "valid" } });

    expect(result.order).toEqual(["global-guard", "group-guard", "handler"]);

    if (client2?.close) await client2.close();
    await app2.microservice.stop();
  });
});
