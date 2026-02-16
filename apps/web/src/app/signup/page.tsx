import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/lib/actions/auth-actions";
import { getSessionContext } from "@/lib/auth/session";

export default async function SignupPage() {
  const session = await getSessionContext();
  if (session) {
    redirect("/app");
  }

  return (
    <main className="site-wrapper">
      <section className="section">
        <div className="container">
          <div className="panel" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <h1 className="section-title">Create Your SourceTrace Account</h1>
            <p className="section-intro">
              Set up your account, onboard your app, and start attribution
              tracking across paid and influencer channels.
            </p>

            <form action={signupAction} className="stack">
              <label>
                Work email
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
                Create Account
              </button>
            </form>

            <p className="app-subheading" style={{ marginTop: "1rem" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--accent)" }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

