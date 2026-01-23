import { Elysia } from "elysia";
import { Microservice, MessagePattern, Payload } from "@elysia-microservice/core";
import { NestAdapter } from "@elysia-microservice/adapters";

class EchoController {
  @MessagePattern("echo")
  echo(@Payload() data: any) {
    return data;
  }
}

const app = new Elysia()
  .use(
    Microservice({
      hybrid: false,
      server: {
        transport: "tcp",
        options: {
          host: "127.0.0.1",
          port: 7001,
        },
      },
      adapters: [
        {
          class: NestAdapter,
          initializer: (adapter, registry) => {
            adapter.init(registry, new EchoController());
          },
        },
      ],
    })
  );

const main = async () => {
  console.log("Starting Elysia microservice echo server on tcp://127.0.0.1:7001 ...");
  await app.microservice.start();
  await app.microservice.awaitReady();
  console.log("Elysia microservice echo server is ready.");
};

main().catch((err) => {
  console.error("Failed to start Elysia echo server", err);
  process.exit(1);
});
