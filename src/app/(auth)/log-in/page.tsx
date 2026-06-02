import { redirect } from "next/navigation";
import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { LogInForm } from "@/features/auth/ui/log-in-form";
import { getSafeNextPath } from "@/shared/navigation/next-path";

interface LogInPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function LogInPage({ searchParams }: LogInPageProps) {
  const user = await new SupabaseAuthGateway().getCurrentUser();
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(next ?? null);

  if (user) {
    redirect(nextPath);
  }

  return (
    <AuthShell
      footerHref={`/sign-up?next=${encodeURIComponent(nextPath)}`}
      footerLabel="Don't have an account?"
      footerLinkLabel="Sign up"
      heading="Flashcards AI"
      subheading="Welcome back. Ready to focus?"
    >
      <LogInForm nextPath={nextPath} />
    </AuthShell>
  );
}
