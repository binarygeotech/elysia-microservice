import { createTcpClient } from "@elysia-microservice/client-tcp";

/**
 * Pattern Matching Client
 * Tests various pattern matching scenarios
 */

async function testPatternMatching() {
  const client = createTcpClient({ host: "127.0.0.1", port: 4000 });

  console.log("🧪 Testing Pattern Matching\n");

  try {
    // Test 1: Exact match
    console.log("1️⃣ Testing exact match: auth.login");
    const loginResult = await client.send("auth.login", { 
      username: "alice", 
      password: "secret123" 
    });
    console.log("   Result:", loginResult, "\n");

    // Test 2: Wildcard patterns (users.*)
    console.log("2️⃣ Testing wildcard pattern: users.*");
    
    const createResult = await client.send("users.created", { 
      userId: "user123", 
      email: "alice@example.com" 
    });
    console.log("   users.created:", createResult);

    const updateResult = await client.send("users.updated", { 
      userId: "user123", 
      name: "Alice Smith" 
    });
    console.log("   users.updated:", updateResult);

    const deleteResult = await client.send("users.deleted", { 
      userId: "user123" 
    });
    console.log("   users.deleted:", deleteResult, "\n");

    // Test 3: Regex patterns (order.\d+)
    console.log("3️⃣ Testing regex pattern: /^order\\.[0-9]+$/");
    
    const order1 = await client.send("order.123", { 
      items: ["item1", "item2"], 
      total: 99.99 
    });
    console.log("   order.123:", order1);

    const order2 = await client.send("order.456", { 
      items: ["item3"], 
      total: 49.99 
    });
    console.log("   order.456:", order2, "\n");

    // Test 4: Catchall handler (unmatched pattern)
    console.log("4️⃣ Testing catchall handler: unknown.pattern");
    const unknownResult = await client.send("unknown.pattern", { 
      data: "this should be caught by catchall" 
    });
    console.log("   Result:", unknownResult, "\n");

    // Test 5: Event patterns (fire and forget)
    console.log("5️⃣ Testing event patterns");
    
    await client.emit("notifications.email", { 
      to: "alice@example.com", 
      subject: "Welcome!" 
    });
    console.log("   notifications.email emitted");

    await client.emit("notifications.push", { 
      deviceId: "device123", 
      message: "New message" 
    });
    console.log("   notifications.push emitted");

    await client.emit("analytics.pageview", { 
      page: "/home", 
      userId: "user123" 
    });
    console.log("   analytics.pageview emitted");

    await client.emit("unknown.event", { 
      data: "caught by event catchall" 
    });
    console.log("   unknown.event emitted (should trigger catchall)\n");

    console.log("✅ All tests completed!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.close();
  }
}

// Add delay to ensure server is ready
setTimeout(testPatternMatching, 1000);
