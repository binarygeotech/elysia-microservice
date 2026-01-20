export function enableGracefulShutdown(stop: () => Promise<void>) {
  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[microservice] shutting down (${signal})`);
    await stop();
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
