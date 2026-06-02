import Link from "next/link";

interface AuthShellProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
}

export function AuthShell({
  children,
  heading,
  subheading,
  footerLabel,
  footerHref,
  footerLinkLabel,
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-surface px-margin-mobile py-xl text-on-surface">
      <div className="w-full max-w-[420px]">
        <header className="mb-xl flex flex-col items-center text-center">
          <div className="mb-md flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-[32px] font-bold text-on-primary shadow-level1">
            M
          </div>
          <p className="text-label-sm uppercase text-on-surface-variant">Memora</p>
          <h1 className="mt-xs text-display-lg-mobile text-primary">{heading}</h1>
          <p className="mt-xs text-body-md text-on-surface-variant">{subheading}</p>
        </header>

        {children}

        <p className="mt-lg text-center text-body-md text-on-surface-variant">
          {footerLabel}{" "}
          <Link className="font-semibold text-primary hover:underline" href={footerHref}>
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
