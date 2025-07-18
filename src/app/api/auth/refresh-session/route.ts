import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookieStore.set(name, value, options);
          },
          remove: (name: string, options: any) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error refreshing session from API route:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    if (session) {
      console.log('API Route: Session refresh successful. User ID:', session.user.id);
      
      const response = NextResponse.json({ success: true, message: 'Session refreshed' }, { status: 200 });
      return response;
    } else {
      console.log('API Route: No session found during refresh.');
      return NextResponse.json({ success: false, message: 'No active session' }, { status: 401 });
    }
  } catch (error) {
    console.error('API Route: Unexpected error during session refresh:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 