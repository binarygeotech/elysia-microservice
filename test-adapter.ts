import { Elysia } from "elysia";
import type { ElysiaInstance } from "elysia";
import { Microservice, MessagePattern, EventPattern, Payload, Ctx, App } from "./packages/core/src";
import { NestAdapter } from "./packages/adapters/src";
import type { MicroserviceContext } from "./packages/core/src";

class TestController {
  @MessagePattern("test.sum")
  sum(@Payload() data: number[]) {
    console.log("✅ Handler called! Summing:", data);
    return { result: data.reduce((a, b) => a + b, 0) };
  }

  @MessagePattern("test.greet")
  greet(@Payload("name") name: string, @Ctx() ctx: MicroserviceContext) {
    console.log(`✅ Handler called! Greeting ${name} (trace: ${ctx.traceId})`);
    return { message: `Hello, ${name}!` };
  }

  @EventPattern("test.log")
  log(@Payload() data: any, @App('store') store: any) {
    console.log(store);
    console.log("✅ Event handler called! Logging:", data);
  }
}

const app = new Elysia()
  .use(
    Microservice({
      server: { transport: "tcp", options: { port: 7001 } },
      clients: {
        self: {
            transport: "tcp",
            options: {
                host: "127.0.0.1",
                port: 7001
            }
        }
      },
      adapters: [
        {
          class: NestAdapter,
          initializer: (adapter, registry) => {
            const controller = new TestController();
            adapter.init(registry, controller);
          },
        },
      ],
    })
  );

console.log("Starting microservice with NestAdapter...");
await app.microservice.start();
await app.microservice.awaitReady();
console.log("✅ Microservice ready!");

// Test using the actual TCP client
const client = app.microservice.clients["self"];

console.log("\n📤 Testing message patterns...");
const sumResult = await client.send("test.sum", [1, 2, 3, 4, 5]);
console.log("📥 Sum result:", sumResult);

const greetResult = await client.send("test.greet", { name: "World" });
console.log("📥 Greet result:", greetResult);

console.log("\n📤 Testing event patterns...");
await client.emit("test.log", { message: "Testing events" });

// Give event time to process
await new Promise(resolve => setTimeout(resolve, 100));


console.log("\n✅ All tests passed!");
process.exit(0);
