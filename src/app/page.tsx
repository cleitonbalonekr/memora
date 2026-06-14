
import { redirect } from "next/navigation";
import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";

export default async function Home() {
  const user = await new SupabaseAuthGateway().getCurrentUser();
  redirect(user ? "/dashboard" : "/log-in");
}
