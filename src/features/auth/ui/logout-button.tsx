import { logOutAction } from "@/app/(auth)/actions";

export function LogoutButton() {
  return (
    <form action={logOutAction}>
      <button className="rounded-lg border border-outline-variant px-md py-sm text-label-md text-on-surface transition hover:bg-surface-container-low" type="submit">
        Log out
      </button>
    </form>
  );
}
