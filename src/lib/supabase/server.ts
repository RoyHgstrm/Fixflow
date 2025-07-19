import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { type CustomSession } from '@/lib/types';

export async function createServerSupabaseClient() {
  const cookieStore = cookies(); // This is a function call, but it returns a ReadonlyRequestCookies type

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return (cookieStore as any).get(name)?.value; // No await needed here, cookieStore is already resolved
        },
        set(name: string, value: string, options: any) {
          try {
            (cookieStore as any).set(name, value, options); // Call set directly on cookieStore
          } catch (error) {
            // Ignore set errors from server components
          }
        },
        remove(name: string, options: any) {
          try {
            (cookieStore as any).set(name, '', { ...options, maxAge: 0 }); // Call set directly on cookieStore to remove
          } catch (error) {
            // Ignore remove errors from server components
          }
        },
      },
    }
  );
}

export async function handleSupabaseRateLimit(
  request: NextRequest, 
  originalHandler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await originalHandler(request);
    } catch (error: any) {
      // Check for rate limit error
      if (error.status === 429 || error.message.includes('rate limit')) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`Rate limit hit. Retrying in ${delay}ms (Attempt ${attempt})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // If last attempt fails, throw the error
        if (attempt === MAX_RETRIES) {
          console.error('Max retries reached for rate-limited request');
          throw error;
        }
      } else {
        // For non-rate limit errors, rethrow immediately
        throw error;
      }
    }
  }

  // Fallback error response
  return NextResponse.json(
    { error: 'Request failed after multiple attempts' }, 
    { status: 500 }
  );
}

export async function refreshSession(session: CustomSession) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token || '',
    });

    if (error) {
      console.error('Session refresh error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
} 