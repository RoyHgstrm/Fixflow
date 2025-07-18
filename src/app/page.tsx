import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import HomePageClient from './_components/HomePageClient';

export default async function Home() {
  try {
    // Create Supabase client directly, cookies are handled internally
    const supabase = await createServerSupabaseClient();

    // Fetch the session, ensuring it's awaited
    const { data: { session } } = await supabase.auth.getSession();

    // If user is authenticated, redirect to dashboard
    if (session) {
      redirect('/dashboard');
    }

    return <HomePageClient />;
  } catch (error) {
    console.error('Error processing home page:', error);
    return <HomePageClient />;
  }
}

