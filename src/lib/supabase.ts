import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Define environment variable schema with more flexible validation
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional()
})

// Enhanced environment variable validation
const validateEnv = () => {
  // Check if we're running on the client or server
  const isServer = typeof window === 'undefined'

  // If on the client, use process.env directly
  // If on the server, use environment variables from Next.js config
  const env = isServer 
    ? process.env 
    : {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    }

  try {
    return envSchema.parse(env)
  } catch (error) {
    console.error('❌ Environment Variable Validation Failed:', error)
    
    // More detailed error logging
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`)
      })
    }

    // Provide guidance for resolution
    console.warn(`
🔧 Troubleshooting Environment Variables:
1. Check your .env.local file
2. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
3. Verify environment variable loading in Next.js config
4. Restart your development server
    `)

    throw new Error('Invalid environment variables')
  }
}

// Validate and extract environment variables
const env = validateEnv()

// Initialize Supabase clients
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL, 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Conditionally create admin client if service role key is available
export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
    env.NEXT_PUBLIC_SUPABASE_URL, 
    env.SUPABASE_SERVICE_ROLE_KEY
  )
  : null

// Function to apply migrations
export async function applyMigration() {
  if (!supabaseAdmin) {
    console.warn('Service role key not provided. Skipping migrations.')
    return
  }

  try {
    // Create migrations table if it doesn't exist
    await supabaseAdmin.rpc('create_migrations_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS _migrations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    // Check if migration has been applied
    const { data: existingMigration } = await supabaseAdmin
      .from('_migrations')
      .select('name')
      .eq('name', 'make_password_optional')
      .single();

    if (!existingMigration) {
      // Apply the migration
      await supabaseAdmin.rpc('run_sql', {
        sql: `
          -- Make password field optional
          ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

          -- Add missing fields to users table
          ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS image TEXT,
            ADD COLUMN IF NOT EXISTS email_verified TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS phone TEXT,
            ADD COLUMN IF NOT EXISTS job_title TEXT,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS reset_token TEXT,
            ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS joined_company_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

          -- Add missing fields to companies table
          ALTER TABLE companies
            ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
        `
      });

      // Record that the migration was applied
      await supabaseAdmin
        .from('_migrations')
        .insert([{ name: 'make_password_optional' }]);

      console.log('Migration applied successfully');
    } else {
      console.log('Migration was already applied');
    }
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw the error as the migration might have already been applied
    // or we might not have permissions to create the migrations table
  }
}

// Verify the clients are working in development
if (process.env.NODE_ENV === 'development') {
  async function verifyClients() {
    try {
      // Test the public client with auth configuration
      const { data: publicData, error: publicError } = await supabase.auth.getSession()
      if (publicError) throw new Error(`Public client error: ${publicError.message}`)

      // Test the admin client with auth configuration if available
      if (supabaseAdmin) {
        const { data: adminData, error: adminError } = await supabaseAdmin.auth.getSession()
        if (adminError) throw new Error(`Admin client error: ${adminError.message}`)
      }

      console.log('✓ Supabase clients verified successfully')
    } catch (error) {
      console.error('Error verifying Supabase clients:', error)
    }
  }
  verifyClients()
} 