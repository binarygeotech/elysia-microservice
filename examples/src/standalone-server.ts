// Example: Standalone Mode (Microservice Only)
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } }
  }))
  .onMsMessage('get.user', async (ctx) => {
    console.log('📨 Received get.user request:', ctx.data);
    return { 
      id: ctx.data.id, 
      name: 'Jane Smith',
      role: 'admin'
    };
  })
  .onMsMessage('math.add', async (ctx) => {
    console.log('🔢 Calculating:', `${ctx.data.a} + ${ctx.data.b}`);
    return { result: ctx.data.a + ctx.data.b };
  })
  .onMsEvent('log.message', (ctx) => {
    console.log('📝 Log event:', ctx.data.message);
  });

// Manually start the microservice
await app.microservice.start();
await app.microservice.awaitReady();

console.log('✅ Microservice ready on tcp://localhost:4000');
console.log('');
console.log('Available patterns:');
console.log('  - get.user (message)');
console.log('  - math.add (message)');
console.log('  - log.message (event)');
console.log('');
console.log('Use a client to send messages to tcp://localhost:4000');
