import { redirect } from "next/navigation";
import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";
import { getSafeNextPath } from "@/shared/navigation/next-path";

interface SignUpPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const user = await new SupabaseAuthGateway().getCurrentUser();
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(next ?? null);

  if (user) {
    redirect(nextPath);
  }

  return (
    <AuthShell
      footerHref={`/log-in?next=${encodeURIComponent(nextPath)}`}
      footerLabel="Already have an account?"
      footerLinkLabel="Log in"
      heading="Create account"
      subheading="Draft better cards and study them anywhere."
    >
      <SignUpForm nextPath={nextPath} />
    </AuthShell>
  );
}
