const { execSync } = require('child_process');

process.env.DATABASE_URL = 'file:./prisma/dev.db';

console.log('Running prisma generate...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  console.log('Prisma generate completed successfully!');
} catch (e) {
  console.error('Prisma generate failed:', e.message);
  process.exit(1);
}

console.log('\nRunning prisma db push...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
  console.log('Prisma db push completed successfully!');
} catch (e) {
  console.error('Prisma db push failed:', e.message);
  process.exit(1);
}
