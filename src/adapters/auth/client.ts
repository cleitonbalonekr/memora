import { createServerClient, createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for Server Components, Route Handlers, or Server Actions.
 * Handles reading and writing session cookies securely.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
            Object.entries(headers).forEach(([key, value]) => {
              // Server Components cannot mutate response headers.
              void key;
              void value;
            });
          } catch {
            // The `setAll` method can be called from a Server Component.
            // This can be ignored if Proxy refreshes user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for client-side components.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
