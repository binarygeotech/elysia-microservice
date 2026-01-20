import { test, expect } from "bun:test";
import { createRegistry } from "../src/patterns/registry";

test("Pattern Matching - Exact match (highest priority)", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("auth.login", (ctx) => ({ exact: true, data: ctx.data }));
  const result = await registry.resolveAndRunRequest("auth.login", { username: "test" });
  
  expect(result).toEqual({ exact: true, data: { username: "test" } });
});

test("Pattern Matching - Wildcard match", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("users.*", (ctx) => ({ wildcard: true, pattern: ctx.pattern, data: ctx.data }));
  
  // Should match users.created
  const result1 = await registry.resolveAndRunRequest("users.created", { id: 1 });
  expect(result1.wildcard).toBe(true);
  expect(result1.pattern).toBe("users.created");
  
  // Should match users.updated
  const result2 = await registry.resolveAndRunRequest("users.updated", { id: 2 });
  expect(result2.wildcard).toBe(true);
  expect(result2.pattern).toBe("users.updated");
  
  // Should match users.deleted
  const result3 = await registry.resolveAndRunRequest("users.deleted", { id: 3 });
  expect(result3.wildcard).toBe(true);
});

test("Pattern Matching - Regex match", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("/^order\\.[0-9]+$/", (ctx) => ({ regex: true, pattern: ctx.pattern }));
  
  // Should match order.123
  const result1 = await registry.resolveAndRunRequest("order.123", {});
  expect(result1.regex).toBe(true);
  expect(result1.pattern).toBe("order.123");
  
  // Should match order.456
  const result2 = await registry.resolveAndRunRequest("order.456", {});
  expect(result2.regex).toBe(true);
  
  // Should NOT match order.abc
  await expect(registry.resolveAndRunRequest("order.abc", {})).rejects.toThrow();
});

test("Pattern Matching - Catchall handler", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("exact.pattern", (ctx) => ({ exact: true }));
  registry.registerCatchallMessage((ctx) => ({ 
    catchall: true, 
    pattern: ctx.pattern,
    incoming: ctx.incoming 
  }));
  
  // Exact match should take priority
  const result1 = await registry.resolveAndRunRequest("exact.pattern", {});
  expect(result1).toEqual({ exact: true });
  
  // Unknown pattern should use catchall
  const result2 = await registry.resolveAndRunRequest("unknown.pattern", { test: "data" });
  expect(result2.catchall).toBe(true);
  expect(result2.pattern).toBe("unknown.pattern");
  expect(result2.incoming).toBe("unknown.pattern");
});

test("Pattern Matching - Priority order (exact > wildcard > regex > catchall)", async () => {
  const registry = createRegistry();
  
  // Register all types
  registry.registerMessage("users.created", (ctx) => ({ exact: true }));
  registry.registerMessage("users.*", (ctx) => ({ wildcard: true }));
  registry.registerMessage("/^users\\..*$/", (ctx) => ({ regex: true }));
  registry.registerCatchallMessage((ctx) => ({ catchall: true }));
  
  // Should match exact first
  const result = await registry.resolveAndRunRequest("users.created", {});
  expect(result).toEqual({ exact: true });
});

test("Pattern Matching - Event handlers", async () => {
  const registry = createRegistry();
  
  let called = false;
  let receivedData = null;
  registry.registerEvent("notifications.*", (ctx) => { 
    called = true; 
    receivedData = ctx.data;
  });
  
  await registry.resolveAndRunEvent("notifications.email", { to: "test@example.com" });
  expect(called).toBe(true);
  expect(receivedData).toEqual({ to: "test@example.com" });
});

test("Pattern Matching - Catchall with pattern injection", async () => {
  const registry = createRegistry();
  
  registry.registerCatchallMessage((ctx) => ({
    error: `No handler for ${ctx.pattern}`,
    data: ctx.data,
    incoming: ctx.incoming
  }));
  
  const result = await registry.resolveAndRunRequest("unknown.pattern", { id: 123 });
  expect(result.error).toBe("No handler for unknown.pattern");
  expect(result.data).toEqual({ id: 123 });
  expect(result.incoming).toBe("unknown.pattern");
});

test("Pattern Matching - Wildcard edge cases", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("api.*", (ctx) => ({ match: "api.*", pattern: ctx.pattern }));
  registry.registerMessage("api.v1.*", (ctx) => ({ match: "api.v1.*", pattern: ctx.pattern }));
  
  // api.users should match api.*
  const result1 = await registry.resolveAndRunRequest("api.users", {});
  expect(result1.match).toBe("api.*");
  
  // api.v1.users should match api.v1.* (more specific, higher score)
  const result2 = await registry.resolveAndRunRequest("api.v1.users", {});
  expect(result2.match).toBe("api.v1.*");
});

test("Pattern Matching - Regex with flags", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("/^USER\\./i", (ctx) => ({ caseInsensitive: true, pattern: ctx.pattern }));
  
  // Should match case-insensitively
  const result1 = await registry.resolveAndRunRequest("user.created", {});
  expect(result1.caseInsensitive).toBe(true);
  
  const result2 = await registry.resolveAndRunRequest("USER.created", {});
  expect(result2.caseInsensitive).toBe(true);
  
  const result3 = await registry.resolveAndRunRequest("UsEr.created", {});
  expect(result3.caseInsensitive).toBe(true);
});

test("Pattern Matching - No handler found (no catchall)", async () => {
  const registry = createRegistry();
  
  registry.registerMessage("known.pattern", (ctx) => ({ known: true }));
  
  // Should throw error when no handler matches
  await expect(registry.resolveAndRunRequest("unknown.pattern", {})).rejects.toThrow(
    'No handler found for pattern "unknown.pattern"'
  );
});
