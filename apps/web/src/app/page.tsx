import Link from "next/link";
import { metricCards } from "@/lib/mock-data";

const features = [
  {
    title: "Channel Attribution",
    description:
      "Attribute installs and post-install events across paid social, influencer links, and organic channels.",
  },
  {
    title: "Influencer Tracking",
    description:
      "Generate clean tracking links per creator and compare CAC, retention, and attributed revenue in one view.",
  },
  {
    title: "Decision Dashboards",
    description:
      "Get campaign-level CPI, CPA, and ROAS with filters by source, platform, geography, and time window.",
  },
];

const faqItems = [
  {
    question: "How long does implementation take?",
    answer:
      "Most teams can ship first links and test attribution events within one day using our onboarding checklist.",
  },
  {
    question: "Can I track TikTok and Instagram creators?",
    answer:
      "Yes. Create one link per campaign or influencer and SourceTrace reports installs and events by that identifier.",
  },
  {
    question: "Is pricing predictable?",
    answer:
      "SourceTrace uses transparent tier limits and explicit overage policy, so spend does not jump unexpectedly.",
  },
  {
    question: "How fast is reporting?",
    answer:
      "The system target is near real-time aggregation with standard dashboard freshness under 15 minutes.",
  },
];

export default function HomePage() {
  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="container site-header-row">
          <Link href="/" className="brand">
            <span className="brand-mark">ST</span>
            <span>SourceTrace</span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="hero-actions">
            <Link className="button button-secondary" href="/login">
              Log In
            </Link>
            <Link className="button button-primary" href="/signup">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="reveal">
              <h1>Mobile attribution that respects your budget.</h1>
              <p>
                SourceTrace helps growth teams track where installs and revenue
                come from across TikTok, Meta, influencer campaigns, and
                organic channels, without enterprise MMP pricing.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/signup">
                  Start Product Setup
                </Link>
                <a className="button button-secondary" href="#pricing">
                  View Pricing
                </a>
              </div>
              <div className="pill-row" aria-label="Core platform capabilities">
                <span className="pill">Last-click attribution</span>
                <span className="pill">Influencer links</span>
                <span className="pill">iOS + Android support</span>
                <span className="pill">Dashboard exports</span>
              </div>
            </div>

            <aside className="hero-panel reveal reveal-delay-1">
              <h2 className="section-title">Live Snapshot</h2>
              <p className="section-intro">
                Example metrics from a blended paid + influencer acquisition
                workspace.
              </p>
              <div className="metric-grid">
                {metricCards.map((metric) => (
                  <article key={metric.id} className="metric-card">
                    <span className="metric-label">{metric.label}</span>
                    <span className="metric-value">{metric.value}</span>
                    <span className="metric-trend">{metric.trend}</span>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <h2 className="section-title reveal">Built for practical growth teams</h2>
            <p className="section-intro reveal reveal-delay-1">
              SourceTrace focuses on the attribution workflows that directly
              impact channel spend decisions: link tracking, install attribution,
              post-install revenue, and campaign-level reporting.
            </p>
            <div className="cards-grid">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className={`card reveal reveal-delay-${Math.min(index + 1, 3)}`}
                >
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <h2 className="section-title">Transparent pricing tiers</h2>
            <p className="section-intro">
              Built around predictable monthly cost with clear usage limits and
              no hidden add-ons for core reporting.
            </p>
            <div className="pricing-grid">
              <article className="price-card">
                <span className="plan">Starter</span>
                <p className="price">$99</p>
                <p className="price-subtext">per month</p>
                <ul className="feature-list">
                  <li>Up to 100k tracked events</li>
                  <li>Up to 10k attributed installs</li>
                  <li>3 team seats</li>
                  <li>CSV exports</li>
                </ul>
              </article>

              <article className="price-card price-highlight">
                <span className="plan">Growth</span>
                <p className="price">$399</p>
                <p className="price-subtext">per month</p>
                <ul className="feature-list">
                  <li>Up to 1M tracked events</li>
                  <li>Up to 100k attributed installs</li>
                  <li>Unlimited seats</li>
                  <li>Priority support</li>
                </ul>
              </article>

              <article className="price-card">
                <span className="plan">Scale</span>
                <p className="price">Custom</p>
                <p className="price-subtext">annual contract</p>
                <ul className="feature-list">
                  <li>Custom usage limits</li>
                  <li>Dedicated SLA options</li>
                  <li>Security review support</li>
                  <li>Implementation support</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="container">
            <h2 className="section-title">Frequently asked questions</h2>
            <div className="faq-grid">
              {faqItems.map((item, index) => (
                <article
                  key={item.question}
                  className={`faq-item reveal reveal-delay-${Math.min(index + 1, 3)}`}
                >
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta-band">
              <h2 className="section-title">Ship attribution in days, not weeks.</h2>
              <p>
                Start with links and core install tracking, then expand into
                channel and revenue reporting as campaigns scale.
              </p>
              <div className="hero-actions">
                <Link className="button button-secondary" href="/signup">
                  Open Product Workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-row">
          <span>© 2026 SourceTrace</span>
          <span>Attribution without enterprise pricing.</span>
        </div>
      </footer>
    </div>
  );
}
