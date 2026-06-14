import { LogoutButton } from "@/features/auth/ui/logout-button";

export default function SettingsPage() {
  return (
    <>
      <header className="flex flex-col gap-xs">
        <h1 className="text-headline-md text-on-surface">Settings</h1>
        <p className="text-body-md text-on-surface-variant">
          More preferences coming soon.
        </p>
      </header>

      <section className="flex flex-col gap-md rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md">
        <div className="flex flex-col gap-xs">
          <h2 className="text-headline-sm text-on-surface">Account</h2>
          <p className="text-body-md text-on-surface-variant">
            Sign out of your account on this device.
          </p>
        </div>
        <LogoutButton />
      </section>
    </>
  );
}
