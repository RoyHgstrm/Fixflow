import { z } from 'zod';

// Define the schema for environment variables
export const envSchema = z.object({
  // Existing environment variables
  NODE_ENV: z.enum(['development', 'production', 'test']),
  ENCRYPTION_KEY: z.string(),
  NEXTAUTH_URL: z.string().url(),
  
  // Supabase environment variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Add other environment variables as needed
});

// Validate and export environment variables
export const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
})();
