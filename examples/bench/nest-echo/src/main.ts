import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { Controller, Module } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

@Controller()
class EchoController {
  @MessagePattern("echo")
  echo(data: any) {
    return data;
  }
}

@Module({ controllers: [EchoController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: "127.0.0.1",
      port: 7002,
    },
  });

  app.useLogger(false as any);

  await app.listen();
  console.log("NestJS microservice echo server is ready on tcp://127.0.0.1:7002");
}

bootstrap().catch((err) => {
  console.error("Failed to start NestJS echo server", err);
  process.exit(1);
});
