import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const schemaFile = isPostgres ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';

console.log(`[MarketingFlow Entrypoint] Target DB Engine: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
console.log(`[MarketingFlow Entrypoint] Applying schema from: ${schemaFile}`);

try {
  execSync(`npx prisma db push --schema=${schemaFile} --accept-data-loss`, {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
  });
} catch (e) {
  console.warn('[MarketingFlow Entrypoint] Notice during DB push:', e.message);
}

// Run initial seed if requested or in container
if (process.env.AUTO_SEED !== 'false') {
  try {
    console.log('[MarketingFlow Entrypoint] Verifying database seed...');
    execSync('node src/seeds/seed.js', {
      stdio: 'inherit',
      cwd: __dirname,
      env: process.env,
    });
  } catch (e) {
    console.warn('[MarketingFlow Entrypoint] Seed completed with notice:', e.message);
  }
}

console.log('[MarketingFlow Entrypoint] Starting Express API & Background Automation Worker...');
await import('./src/index.js');
