import { describe, it, expect } from "bun:test";
import { createRegistry } from "../src/patterns/registry";
import { encode, decode } from "../src/protocol/frame";
import { MessagePattern } from "../src/patterns/message";
import { EventPattern } from "../src/patterns/event";

describe("Registry", () => {
  it("should register message handlers", async () => {
    const registry = createRegistry();
    const handler = (ctx: any) => ctx.data;
    
    registry.registerMessage("test.pattern", handler);
    
    const result = await registry.resolveAndRunRequest("test.pattern", { test: "data" });
    expect(result).toEqual({ test: "data" });
  });

  it("should register event handlers", async () => {
    const registry = createRegistry();
    let called = false;
    let receivedData: any = null;
    const handler = (ctx: any) => { 
      called = true; 
      receivedData = ctx.data;
    };
    
    registry.registerEvent("test.event", handler);
    
    await registry.resolveAndRunEvent("test.event", { event: "data" });
    expect(called).toBe(true);
    expect(receivedData).toEqual({ event: "data" });
  });

  it("should register clients", () => {
    const registry = createRegistry();
    const client = { send: async () => {}, close: async () => {} };
    
    registry.registerClient("myClient", client);
    
    expect(registry.clients.get("myClient")).toBe(client);
  });
});

describe("Protocol", () => {
  it("should encode and decode messages", () => {
    const original = { id: "123", pattern: "test", data: { foo: "bar" } };
    
    const encoded = encode(original);
    const decoded = decode(encoded);
    
    expect(decoded).toEqual(original);
  });

  it("should handle large messages", () => {
    const original = {
      id: "456",
      pattern: "large.test",
      data: { items: Array(1000).fill({ name: "test", value: 123 }) }
    };
    
    const encoded = encode(original);
    const decoded = decode(encoded);
    
    expect(decoded).toEqual(original);
  });
});

describe("Patterns", () => {
  it("should apply MessagePattern decorator", () => {
    class TestController {
      @MessagePattern("get.user")
      getUser(data: any) {
        return { id: data.id };
      }
    }

    const controller = new TestController();
    expect((controller as any).__messages).toBeDefined();
    expect((controller as any).__messages.length).toBe(1);
    expect((controller as any).__messages[0].pattern).toBe("get.user");
  });

  it("should apply EventPattern decorator", () => {
    class TestController {
      @EventPattern("user.created")
      onUserCreated(data: any) {
        console.log(data);
      }
    }

    const controller = new TestController();
    expect((controller as any).__events).toBeDefined();
    expect((controller as any).__events.length).toBe(1);
    expect((controller as any).__events[0].pattern).toBe("user.created");
  });
});
