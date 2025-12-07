import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmdqzjiweylmhzfgnbmy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZHF6aml3ZXlsbWh6ZmduYm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDc0NzgsImV4cCI6MjA4MDY4MzQ3OH0.Yi42pDFkawv0hFhA56yp82tMHIOlxt3vLiKduXH3h1w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}






