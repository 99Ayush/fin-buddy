import { createServer } from 'vite';

// Keep stdin open to prevent process termination in headless environments
if (process.stdin) {
  process.stdin.resume();
}

try {
  const server = await createServer({
    root: './frontend',
    server: {
      port: 5173,
      host: true,
    },
  });

  await server.listen();
  console.log('🚀 Vite dev server running on http://localhost:5173');
} catch (err) {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
}
