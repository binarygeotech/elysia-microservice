// Example: TCP Client
import { createTcpClient } from '@elysia-microservice/client-tcp';

const client = createTcpClient({ 
  host: '127.0.0.1',
  port: 4000 
});

console.log('🔌 Connected to tcp://localhost:4000');
console.log('');

// Send request-response messages
try {
  console.log('📤 Sending get.user request...');
  const user = await client.send('get.user', { id: 123 });
  console.log('📥 Response:', user);
  console.log('');

  console.log('📤 Sending math.add request...');
  const sum = await client.send('math.add', { a: 15, b: 27 });
  console.log('📥 Response:', sum);
  console.log('');

  // Send fire-and-forget events
  console.log('📤 Emitting log.message event...');
  await client.emit('log.message', { 
    message: 'Hello from client!',
    timestamp: new Date().toISOString()
  });
  console.log('✅ Event emitted');

} catch (error) {
  console.error('❌ Error:', error);
} finally {
  await client.close();
  console.log('👋 Disconnected');
}
