import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions/auth-actions";
import { getSessionContext } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSessionContext();
  if (session) {
    redirect("/app");
  }

  return (
    <main className="site-wrapper">
      <section className="section">
        <div className="container">
          <div className="panel" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <h1 className="section-title">Log In</h1>
            <p className="section-intro">
              Access your SourceTrace workspace to review channel attribution and
              campaign performance.
            </p>

            <form action={loginAction} className="stack">
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  className="input"
                  required
                  placeholder="you@company.com"
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </label>

              <button type="submit" className="button button-primary">
                Log In
              </button>
            </form>

            <p className="app-subheading" style={{ marginTop: "1rem" }}>
              New to SourceTrace?{" "}
              <Link href="/signup" style={{ color: "var(--accent)" }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

