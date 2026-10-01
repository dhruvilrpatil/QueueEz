import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║         EzQueue API Server                ║
  ╠═══════════════════════════════════════════╣
  ║  Environment: ${config.nodeEnv.padEnd(27)}║
  ║  Port:        ${String(config.port).padEnd(27)}║
  ║  Client URL:  ${config.clientUrl.padEnd(27)}║
  ╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default server;
