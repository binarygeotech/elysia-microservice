import { describe, it, expect, beforeAll, afterAll } from "bun:test";
// import { Elysia } from "elysia";
// import { Microservice } from "../src/plugin";
// import { createTcpClient } from "@elysia-microservice/client-tcp";

// Skipping plugin tests - requires full ecosystem
// TODO: Re-enable once all packages are published or use relative imports
describe.skip("Microservice Plugin - Standalone Mode", () => {
  let app: any;
  let client: any;

  beforeAll(async () => {
    // Create microservice in standalone mode
    app = new Elysia()
      .use(Microservice({
        server: { transport: "tcp", options: { port: 4100 } },
      }))
      .onMsMessage("test.echo", async ({ data }: any) => {
        return { echo: data.message };
      })
      .onMsMessage("test.add", async ({ data }: any) => {
        return { result: data.a + data.b };
      })
      .onMsEvent("test.log", ({ data }: any) => {
        console.log("Event received:", data);
      });

    // Start microservice manually
    await app.microservice.start();
    await app.microservice.awaitReady();

    // Create client
    client = createTcpClient({ port: 4100 });

    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await client?.close();
    await app?.microservice.stop();
  });

  it("should handle message patterns", async () => {
    const result = await client.send("test.echo", { message: "Hello" });
    expect(result).toEqual({ echo: "Hello" });
  });

  it("should perform calculations", async () => {
    const result = await client.send("test.add", { a: 5, b: 3 });
    expect(result).toEqual({ result: 8 });
  });

  it("should emit events", async () => {
    // Events are fire-and-forget, just ensure no error
    await client.emit("test.log", { message: "Test event" });
    expect(true).toBe(true);
  });

  it("should report healthy", () => {
    expect(app.microservice.health()).toBe(true);
  });

  it("should report ready", () => {
    expect(app.microservice.ready()).toBe(true);
  });

  it("should have registry", () => {
    expect(app.microservice.registry).toBeDefined();
    expect(app.microservice.registry.getRequestPatterns().length).toBeGreaterThan(0);
  });
});

describe.skip("Microservice Plugin - Hybrid Mode", () => {
  let app: any;
  let client: any;

  beforeAll(async () => {
    // Create microservice in hybrid mode
    app = new Elysia()
      .use(Microservice({
        server: { transport: "tcp", options: { port: 4101 } },
        hybrid: true,
      }))
      .onMsMessage("get.user", async ({ data }: any) => {
        return { id: data.id, name: "John Doe" };
      })
      .get("/", () => "HTTP Server")
      .listen(3100);

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create client
    client = createTcpClient({ port: 4101 });
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await client?.close();
    await app?.stop();
  });

  it("should handle HTTP requests", async () => {
    const response = await fetch("http://localhost:3100/");
    const text = await response.text();
    expect(text).toBe("HTTP Server");
  });

  it("should handle microservice requests", async () => {
    const result = await client.send("get.user", { id: 123 });
    expect(result).toEqual({ id: 123, name: "John Doe" });
  });

  it("should have health endpoint", async () => {
    const response = await fetch("http://localhost:3100/health");
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  it("should have ready endpoint", async () => {
    const response = await fetch("http://localhost:3100/ready");
    const data = await response.json();
    expect(data.ready).toBe(true);
  });
});
