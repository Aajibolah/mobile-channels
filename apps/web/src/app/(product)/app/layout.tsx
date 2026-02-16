import Link from "next/link";
import { AppShellNav } from "@/components/app-shell-nav";
import { logoutAction } from "@/lib/actions/auth-actions";
import { requireActiveMembership } from "@/lib/auth/session";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, membership } = await requireActiveMembership();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">ST</span>
          <span>SourceTrace</span>
        </Link>
        <AppShellNav />
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <span className="badge">Workspace: {membership.workspaceName}</span>
          <span className="badge">Role: {membership.role}</span>
          <span className="badge">User: {session.user.email}</span>
          <form action={logoutAction}>
            <button className="button button-secondary" type="submit">
              Log Out
            </button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
