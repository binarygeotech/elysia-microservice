import { createTcpClient } from "@elysia-microservice/client-tcp";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.split("=");
    return [k.replace(/^--/, ""), v ?? true];
  })
);

const target = (args.target as string | undefined) ?? "elysia"; // elysia | nest
const host = (args.host as string | undefined) ?? "127.0.0.1";
const port = Number(args.port ?? (target === "elysia" ? 7001 : 7002));
const concurrency = Number(args.concurrency ?? 100);
const durationSec = Number(args.duration ?? 30);
const payloadSize = Number(args.payload ?? 200);

const payload = { data: "x".repeat(payloadSize) };

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

type EchoClient = {
  send: (payload: any) => Promise<any>;
  close: () => Promise<void> | void;
};

function makeClient(): EchoClient {
  if (target === "elysia") {
    const client = createTcpClient({ host, port });
    return {
      send: (data: any) => client.send("echo", data),
      close: () => client.close(),
    };
  }

  // NestJS TCP client (uses Nest microservices protocol)
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: { host, port },
  });

  return {
    send: async (data: any) => {
      // Ensure connection (connect() is idempotent)
      await client.connect();
      return firstValueFrom(client.send("echo", data));
    },
    close: async () => {
      if (client && (client as any).close) {
        await (client as any).close();
      }
    },
  };
}

async function run() {
  const client = makeClient();
  let sent = 0;
  let completed = 0;
  let errors = 0;
  const latencies: number[] = [];
  const deadline = Date.now() + durationSec * 1000;

  async function worker() {
    while (Date.now() < deadline) {
      const start = performance.now();
      try {
        await client.send("echo", payload);
        const end = performance.now();
        latencies.push(end - start);
        completed++;
      } catch (err) {
        errors++;
      }
      sent++;
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker().catch(() => {}));
  }

  const startWall = Date.now();
  await Promise.all(workers);
  const elapsedMs = Date.now() - startWall;

  await client.close();

  const rps = completed / (elapsedMs / 1000);
  const p50 = percentile(latencies, 50);
  const p90 = percentile(latencies, 90);
  const p99 = percentile(latencies, 99);

  console.log(JSON.stringify({
    target,
    host,
    port,
    concurrency,
    durationSec,
    payloadSize,
    sent,
    completed,
    errors,
    rps: Number(rps.toFixed(2)),
    p50: Number(p50.toFixed(3)),
    p90: Number(p90.toFixed(3)),
    p99: Number(p99.toFixed(3)),
  }, null, 2));
}

run().catch((err) => {
  console.error("Benchmark failed", err);
  process.exit(1);
});
