import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  // 🚨 Prevent Next.js HMR from wiping the singleton by attaching it to the Window
  if (typeof window !== 'undefined') {
    if (!(window as any).supabaseClient) {
      (window as any).supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return (window as any).supabaseClient;
  }

  // Fallback for Server-Side Rendering
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};