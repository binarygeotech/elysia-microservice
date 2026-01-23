// Example: Hybrid Mode (HTTP + Microservice)
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({
    server: { transport: 'tcp', options: { port: 4000 } },
    hybrid: true
  }))
  // Microservice message handlers
  .onMsMessage('get.user', async ({ data }: { data: any }) => {
    return {
      id: data.id,
      name: 'John Doe',
      email: 'john@example.com'
    };
  })
  .onMsMessage('create.user', async ({ data }: { data: any }) => {
    return {
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date().toISOString()
    };
  })
  // Microservice event handlers
  .onMsEvent('user.created', (ctx) => {
    console.log('📧 User created event:', ctx.data);
  })
  // Register '{any}' as a pattern to handle unregistered patterns
  // .onMsMessage('{any}', async () => ({ handler: 'Fallback' }))
  // .onMsEvent('{any}', async () => console.log({ handler: 'Any' }))

  // Use Catchall[Event | Message] to handle unregistered patterns
  .onMsCatchallEvent(async () => console.log({ handler: 'Fallback' }))
  .onMsCatchallMessage(async () => ({ handler: 'Catchall' }))

  // Regular HTTP routes
  .get('/', () => ({
    message: 'Welcome to Elysia Microservice!',
    modes: {
      http: 'http://localhost:3000',
      microservice: 'tcp://localhost:4000'
    }
  }))
  .get('/health', () => ({
    status: app.microservice.health() ? 'healthy' : 'unhealthy',
    ready: app.microservice.ready()
  }))
  .listen(3000);

console.log('🚀 HTTP server running on http://localhost:3000');
console.log('🔌 Microservice running on tcp://localhost:4000');
console.log('');
console.log('Try these:');
console.log('  HTTP: curl http://localhost:3000');
console.log('  HTTP: curl http://localhost:3000/health');
console.log('  Microservice: Use client to send messages to tcp://localhost:4000');
