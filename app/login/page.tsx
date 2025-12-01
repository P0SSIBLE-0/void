import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LoginPageContent from './login-content'; // Import the client component

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  // If no user, render the login form
  return <LoginPageContent />;
}