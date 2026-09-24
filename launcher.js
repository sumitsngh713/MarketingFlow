import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nodeDir = 'C:\\Program Files\\nodejs';
const customEnv = {
  ...process.env,
  PATH: `${nodeDir};${process.env.PATH || ''}`,
  PORT: '5000',
};

console.log('====================================================');
console.log('🚀 Booting MarketingFlow Services (Ports 5000 & 5173)');
console.log('====================================================');

// 1. Start Server on Port 5000
const serverProc = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env: customEnv,
});

// 2. Start Vite directly via Node on Port 5173
const clientProc = spawn('node', ['node_modules/vite/bin/vite.js', '--host'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
  env: customEnv,
});

serverProc.on('error', (err) => console.error('[Backend Error]:', err));
clientProc.on('error', (err) => console.error('[Vite Error]:', err));

process.on('SIGINT', () => {
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
});
