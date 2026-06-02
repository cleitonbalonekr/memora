import { redirect } from "next/navigation";
import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await new SupabaseAuthGateway().getCurrentUser();

  if (!user) {
    redirect("/log-in");
  }

  return children;
}
