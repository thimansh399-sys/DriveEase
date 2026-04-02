const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'ADMIN_PASSWORD'];
const optionalVars = ['ALLOWED_ORIGINS', 'GOOGLE_MAPS_API_KEY', 'FAST2SMS_API_KEY', 'AI_ROUTE_API_URL', 'API_BASE_URL'];

const missingRequired = requiredVars.filter((key) => !String(process.env[key] || '').trim());

console.log('Backend preflight checks');
console.log('------------------------');

if (missingRequired.length) {
  console.error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

const mongoUri = String(process.env.MONGODB_URI || '');
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

console.log('Required env vars: OK');
console.log(`PORT: ${port}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

for (const key of optionalVars) {
  const exists = Boolean(String(process.env[key] || '').trim());
  console.log(`${key}: ${exists ? 'set' : 'not set'}`);
}

if (!String(process.env.FAST2SMS_API_KEY || '').trim()) {
  console.log('Note: FAST2SMS_API_KEY missing. SMS will run in simulation mode.');
}

console.log('Preflight check passed.');
