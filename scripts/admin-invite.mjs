import { randomBytes, createHash } from 'node:crypto';
const origin = new URL(process.argv[2] || 'http://localhost:3000');
if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && origin.hostname === 'localhost')) throw new Error('Use an HTTPS site origin.');
const token = randomBytes(32).toString('hex');
console.log('Set this value as the secret ADMIN_SETUP_TOKEN_HASH in your hosting settings:');
console.log(createHash('sha256').update(token).digest('hex'));
console.log('After deployment, privately open this link and enter your allowlisted admin email:');
console.log(`${origin.origin}/admin#activate=${token}`);
console.log('Keep the link private. It can only activate an account that has no password yet.');
