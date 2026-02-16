import { redirect } from "next/navigation";
import { completeOnboardingAction } from "@/lib/actions/onboarding-actions";
import { getActiveMembership, requireSession } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const session = await requireSession();
  const membership = await getActiveMembership(session.user.id);
  if (membership) {
    redirect("/app");
  }

  return (
    <main className="site-wrapper">
      <section className="section">
        <div className="container">
          <div className="panel" style={{ maxWidth: "760px", margin: "0 auto" }}>
            <h1 className="section-title">Onboarding Setup</h1>
            <p className="section-intro">
              Create your first workspace and register your app so SourceTrace
              can attribute installs and signups by source.
            </p>

            <form action={completeOnboardingAction} className="stack">
              <div className="form-grid">
                <label>
                  Workspace name
                  <input
                    name="workspace_name"
                    className="input"
                    required
                    placeholder="Acme Growth Team"
                  />
                </label>

                <label>
                  App name
                  <input
                    name="app_name"
                    className="input"
                    required
                    placeholder="Acme Fitness"
                  />
                </label>

                <label>
                  iOS bundle ID (optional)
                  <input
                    name="ios_bundle_id"
                    className="input"
                    placeholder="com.acme.fitness"
                  />
                </label>

                <label>
                  App Store ID (optional)
                  <input
                    name="app_store_id"
                    className="input"
                    placeholder="1234567890"
                  />
                </label>

                <label>
                  Android package (optional)
                  <input
                    name="android_package_name"
                    className="input"
                    placeholder="com.acme.fitness"
                  />
                </label>

                <label>
                  Play Store ID (optional)
                  <input
                    name="play_store_id"
                    className="input"
                    placeholder="com.acme.fitness"
                  />
                </label>
              </div>

              <div className="panel">
                <strong>What this unlocks</strong>
                <ul className="feature-list" style={{ marginTop: "0.6rem" }}>
                  <li>Tracking links by source, channel, and campaign</li>
                  <li>Install ingestion from Play/App Store flows</li>
                  <li>Signup and revenue attribution by channel</li>
                </ul>
              </div>

              <div>
                <button type="submit" className="button button-primary">
                  Complete Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

