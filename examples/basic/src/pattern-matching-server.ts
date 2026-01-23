import { Elysia } from "elysia";
import { Microservice } from "@elysia-microservice/core";

/**
 * Pattern Matching Example
 * 
 * This example demonstrates the three types of pattern matching:
 * 1. Exact match - "users.created" matches exactly "users.created"
 * 2. Wildcard match - "users.*" matches "users.created", "users.updated", etc.
 * 3. Regex match - "/user\\..*\/i" matches with regex patterns
 * 4. Catchall handler - handles any pattern not matched by above
 */

const app = new Elysia()
    .use(
        Microservice({
            server: {
                transport: "tcp",
                options: {
                    port: 4000,
                }
            }
        })
    )
    // Exact match - highest priority
    .onMsMessage("auth.login", (ctx) => {
        console.log("[Exact Match] auth.login:", ctx.data);
        return { success: true, message: "Login successful", user: ctx.data.username };
    })
    // Wildcard patterns - matches any pattern starting with "users."
    .onMsMessage("users.*", (ctx) => {
        console.log(`[Wildcard Match] ${ctx.pattern}:`, ctx.data);
        return {
            success: true,
            message: `User operation ${ctx.pattern} completed`,
            userId: ctx.data.userId
        };
    })
    // Regex pattern - matches patterns like "order.123", "order.456"
    .onMsMessage("/^order\\.[0-9]+$/", (ctx) => {
        console.log(`[Regex Match] ${ctx.pattern}:`, ctx.data);
        const orderId = ctx.pattern.split('.')[1];
        return {
            success: true,
            message: `Order ${orderId} processed`,
            data: ctx.data
        };
    })
    // Event patterns work the same way
    .onMsEvent("notifications.*", (ctx) => {
        console.log(`[Wildcard Event] ${ctx.pattern}:`, ctx.data);
    })
    .onMsEvent("/^analytics\\./", (ctx) => {
        console.log(`[Regex Event] ${ctx.pattern}:`, ctx.data);
    })
    // Note: Catchall handlers are not yet re-enabled in the plugin
    // They are being refactored to use the new fallback API
    // Also expose HTTP endpoint
    .get("/", () => ({
        message: "Pattern Matching Microservice",
        patterns: {
            exact: ["auth.login"],
            wildcards: ["users.*", "notifications.*"],
            regex: ["/^order\\.[0-9]+$/", "/^analytics\\./"],
            catchall: "Available for unmatched patterns"
        }
    }))
    .listen(3000);

console.log(`
🚀 Pattern Matching Microservice Started!

HTTP Server: http://localhost:3000
Microservice: TCP on port 4000

Pattern Matching Hierarchy:
1. Exact match (highest priority)
   - auth.login

2. Wildcard patterns
   - users.* → matches users.created, users.updated, users.deleted, etc.
   - notifications.* → matches any notification event

3. Regex patterns
   - /^order\\.[0-9]+$/ → matches order.123, order.456, etc.
   - /^analytics\\./ → matches analytics.pageview, analytics.click, etc.

4. Catchall handlers (lowest priority)
   - Handles any pattern not matched above
   - Prevents silent failures

Try these test clients:
- bun run examples/src/pattern-matching-client.ts
`);
