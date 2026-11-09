import app from './index.js';

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const host = process.env.HOST ?? '127.0.0.1';
if (!['127.0.0.1', '0.0.0.0', '::1'].includes(host))
  throw new Error('HOST must be a loopback address or 0.0.0.0 for local LAN development.');
const server = app.listen(port, host, () => {
  console.log(`Backend listening at http://${host}:${port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close());
}
