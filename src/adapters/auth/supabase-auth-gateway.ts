import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { createClient } from "./client";

export class SupabaseAuthGateway implements AuthGateway {
  async signUp(email: string, password: string): Promise<SessionUser> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Registration failed: no user returned");
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
      needsEmailConfirmation: data.session === null,
    };
  }

  async signIn(email: string, password: string): Promise<SessionUser> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Login failed: no user returned");
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
    };
  }

  async signOut(): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<SessionUser | null> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
    };
  }
}
