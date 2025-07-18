import crypto from 'crypto';

// Generate a cryptographically secure secret key
const generateSecret = () => {
  // Generate 64 random bytes (512 bits) and convert to hex
  const secret = crypto.randomBytes(64).toString('hex');
  console.log('Generated NextAuth Secret:');
  console.log(secret);
  console.log('\nCopy this secret to your .env.local file as ENCRYPTION_KEY');
};

generateSecret(); 