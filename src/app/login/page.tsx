import { redirect } from "next/navigation";
import LoginPageClient from "./LoginPageClient";
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginPageClient />;
}
