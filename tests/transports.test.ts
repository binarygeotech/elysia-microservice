import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { Microservice } from "../packages/core/dist/plugin.js";
import { createTcpClient } from "../packages/client-tcp/dist/tcp.js";
import { createTlsClient } from "../packages/client-tls/dist/tls.js";

describe("TCP Transport", () => {
    let app: any;
    let client: any;

    beforeAll(async () => {
        app = new Elysia()
            .use(Microservice({
                server: { transport: "tcp", options: { port: 4200 } },
            }))
            .onMsMessage("ping", async () => ({ pong: true }));

        await app.microservice.start();
        await app.microservice.awaitReady();

        client = createTcpClient({ port: 4200 });
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterAll(async () => {
        await client?.close();
        await app?.microservice.stop();
    });

    it("should send and receive messages", async () => {
        const result = await client.send("ping", {});
        expect(result).toEqual({ pong: true });
    });
});

describe("TLS Transport", () => {
    let app: any;
    let client: any;

    beforeAll(async () => {
        // Note: This requires proper TLS certificates
        // For testing purposes, you might want to use self-signed certs
        app = new Elysia()
            .use(Microservice({
                server: {
                    transport: "tls",
                    options: {
                        port: 4201,
                        // Add your cert/key paths here for real testing
                        // key: fs.readFileSync('./certs/key.pem'),
                        // cert: fs.readFileSync('./certs/cert.pem'),
                    }
                },
            }))
            .onMsMessage("secure.ping", async () => ({ secure: true }));

        await app.microservice.start();
        await app.microservice.awaitReady();

        // TLS client would need matching cert configuration
        client = createTlsClient({
            port: 4201,
            // rejectUnauthorized: false // For self-signed certs in testing
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterAll(async () => {
        await client?.close();
        await app?.microservice.stop();
    });

    it.skip("should send and receive secure messages", async () => {
        // Skipped by default - requires TLS setup
        const result = await client.send("secure.ping", {});
        expect(result).toEqual({ secure: true });
    });
});
