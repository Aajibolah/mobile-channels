# SourceTrace Product Requirements Document (PRD)

Version: v1.0 (Draft)  
Date: 2026-02-16  
Owner: Product (PM)  
Status: Working Draft

## 1. Executive Summary
SourceTrace is a cost-first mobile attribution and channel analytics platform for startups and growth teams who need reliable install and post-install attribution without enterprise-level MMP pricing.

The initial release includes:
- A public landing page to communicate value, capture leads, and convert signups.
- A core web app for link tracking, channel attribution, campaign reporting, and team collaboration.

Primary product thesis:
- Existing tools are powerful but expensive and overbuilt for early and growth-stage teams.
- SourceTrace competes on price-to-value, implementation speed, and practical reporting.

## 2. Problem Statement
Growth teams running app acquisition across paid and organic channels need to know where installs and revenue come from. Existing attribution options often create barriers:
- High base fees or minimum monthly commitments.
- Add-on pricing for common needs (extra events, seats, exports, API access).
- Long setup and operational complexity.

As a result:
- Teams delay attribution setup.
- Reporting is inconsistent across channels.
- Budget allocation decisions are made with partial or incorrect data.

## 3. Opportunity and Positioning
### 3.1 Market Opportunity
- Large number of app teams between pre-seed and Series B with real acquisition spend but limited analytics budget.
- Influencer and creator-led campaigns are growing, but link-level attribution remains fragmented.

### 3.2 Positioning Statement
For app teams priced out of enterprise MMP tools, SourceTrace is a lightweight attribution platform that delivers core install and revenue attribution at startup-friendly pricing with faster onboarding.

### 3.3 Core Differentiators
- Lower total cost of ownership.
- Transparent pricing.
- Faster go-live (days, not weeks).
- Clean reporting for channels founders and growth marketers actually use.

## 4. Product Goals and Non-Goals
### 4.1 Goals (MVP)
1. Enable teams to attribute installs/events to channels and campaigns.
2. Support paid channels (TikTok, Meta) and influencer links with strong usability.
3. Provide decision-ready dashboards for CAC, CPI, conversion, and revenue.
4. Keep pricing materially below enterprise alternatives.

### 4.2 Non-Goals (MVP)
1. Full enterprise BI replacement.
2. Multi-touch probabilistic attribution beyond defined rules.
3. Deep fraud prevention suite.
4. MMM or incrementality measurement tooling.

## 5. Success Metrics
### 5.1 Business Metrics
- Time-to-value: first attributed install within 24 hours of setup.
- Trial-to-paid conversion rate >= 15% (first 2 quarters target).
- Gross logo retention at 3 months >= 80%.
- Pricing perception score: >= 70% of users agree SourceTrace is "good value for cost."

### 5.2 Product Metrics
- Attribution coverage rate (eligible installs attributed) >= 90% where platform signals allow.
- Dashboard freshness latency <= 15 minutes for standard metrics.
- Link creation to live use median time <= 5 minutes.
- Weekly active usage of dashboard by marketing users >= 60% of active accounts.

### 5.3 Quality Metrics
- P1 defects in production: 0 at GA launch.
- Data discrepancy versus source platform reports <= 10% for pilot channels.

## 6. Target Users and Personas
### 6.1 Primary Personas
1. Growth Lead at startup app company
- Owns channel spend and budget allocation.
- Needs fast, trusted attribution without large tooling spend.

2. Founder/Operator
- Needs simple dashboard to answer "what channel is working."
- Prefers transparent pricing and low setup burden.

3. Performance Marketer / UA Manager
- Needs campaign-level reporting and reliable conversion tracking.

### 6.2 Secondary Persona
1. Agency partner managing campaigns for multiple apps (post-MVP extension).

## 7. Scope
## 7.1 In Scope (MVP)
- Landing page and conversion funnel.
- Workspace/account onboarding.
- Tracking link creation and management.
- Click capture and redirect.
- Install attribution pipeline.
- Post-install event ingestion and attribution.
- Dashboard and CSV export.
- Basic billing and plan gating.

### 7.2 Out of Scope (MVP)
- White-labeled dashboards.
- Advanced cohort builder with arbitrary SQL.
- Native fraud scoring and bot detection suite.
- Automated bid optimization integrations.

## 8. User Journeys
### Journey A: First-Time Team Onboarding
1. User lands on website and signs up for trial.
2. User creates workspace, app profile, and team members.
3. User installs SDK/server integration.
4. User creates first channel tracking link.
5. User sees first attributed installs/events in dashboard.

### Journey B: Influencer Campaign Tracking
1. Marketer creates unique link per influencer.
2. Influencer shares link in bio/story/post.
3. Clicks/install/events are attributed to influencer source.
4. Marketer compares influencer CAC and revenue in dashboard/export.

### Journey C: Paid Campaign Optimization
1. Marketer launches TikTok and Meta campaigns with SourceTrace links.
2. Dashboard shows CPI/CAC/ROAS by campaign and creative metadata.
3. Marketer reallocates spend to higher-performing campaigns.

## 9. Landing Page Requirements
### 9.1 Goals
- Clearly communicate SourceTrace value proposition ("attribution without enterprise pricing").
- Convert visitors to trial signups.
- Build trust via feature clarity and transparent pricing.

### 9.2 Functional Requirements
LP-FR-001: Home page with clear headline, supporting explainer, and primary CTA ("Start Free Trial").  
LP-FR-002: Features section covering attribution, influencer tracking, dashboarding, exports.  
LP-FR-003: Pricing section with plan tiers, included limits, and overage policy.  
LP-FR-004: Integrations section (iOS, Android, server events, channel connectors).  
LP-FR-005: FAQ section addressing setup time, data accuracy, privacy, and pricing.  
LP-FR-006: Lead capture form for teams not ready to start trial.  
LP-FR-007: Legal pages (Privacy Policy, Terms, DPA summary).  
LP-FR-008: Analytics instrumentation for page views, CTA clicks, and signup funnel conversion.

### 9.3 Non-Functional Requirements
LP-NFR-001: Lighthouse performance score >= 85 mobile and desktop.  
LP-NFR-002: Core Web Vitals pass on primary routes.  
LP-NFR-003: Responsive design for common device breakpoints.  
LP-NFR-004: SEO foundations (metadata, sitemap, robots, schema where applicable).

### 9.4 Landing Page Acceptance Criteria
1. Visitor can understand product value within 10 seconds of landing.
2. Visitor can find pricing and CTA without scrolling excessively.
3. End-to-end signup conversion event is tracked in analytics.

## 10. Core Web App Requirements
### 10.1 Modules
1. Authentication and Workspace
2. App Configuration
3. Link Builder and Link Management
4. Attribution Data Pipeline Status
5. Dashboard and Reporting
6. Team Roles and Permissions
7. Billing and Plan Management

### 10.2 Functional Requirements
WA-FR-001: Email/password auth with secure reset flow (SSO optional post-MVP).  
WA-FR-002: Workspace creation with role-based access (`Owner`, `Admin`, `Analyst`, `Viewer`).  
WA-FR-003: App setup wizard for iOS and Android with integration checklist.  
WA-FR-004: Link generator supporting parameters: `source`, `channel`, `campaign`, `adset`, `creative`, `influencer_id`, `country`.  
WA-FR-005: Redirect endpoint with click logging and fallback handling.  
WA-FR-006: Install/event ingestion endpoints (SDK + server-to-server).  
WA-FR-007: Deterministic attribution where possible; rules-based fallback where not.  
WA-FR-008: Attribution windows configurable at workspace level (default 7-day click).  
WA-FR-009: Dashboard metrics: installs, CPI, CPA, revenue, ROAS, conversion rate.  
WA-FR-010: Filters by date, channel, campaign, influencer, platform, geography.  
WA-FR-011: Export CSV for filtered reports.  
WA-FR-012: Billing page with plan limits and usage meter.  
WA-FR-013: Audit trail for key actions (link edits, permission changes, attribution rule changes).

### 10.3 Non-Functional Requirements
WA-NFR-001: App availability target 99.9% monthly (MVP best effort).  
WA-NFR-002: P95 dashboard load time <= 3 seconds for standard date ranges.  
WA-NFR-003: Data processing latency <= 15 minutes for standard events.  
WA-NFR-004: Secure storage and transport (TLS in transit, encryption at rest).  
WA-NFR-005: Multi-tenant data isolation by workspace.

### 10.4 Web App Acceptance Criteria
1. New user can complete setup and create first link in <= 15 minutes.
2. Attributed installs/events appear in dashboard within SLA for test campaigns.
3. Team owner can manage users and plan without support intervention.

## 11. Attribution Logic (MVP)
### 11.1 Attribution Inputs
- Click data from SourceTrace links.
- Install signal from mobile app integration.
- Post-install events from SDK or server.
- Platform-specific attribution signals (iOS/Android constraints respected).

### 11.2 Rules
1. Default model: last eligible click.
2. Default window: 7 days (workspace configurable).
3. If no eligible click found within window, classify as `organic/unattributed`.
4. Re-attribution rule for reinstall and re-engagement: out of scope MVP (define but disable).

### 11.3 Data Definitions
- `Attributed Install`: first install event matched to an eligible click under current rules.
- `Attributed Event`: post-install event tied to attributed install or direct eligible event rule.
- `Organic`: no qualifying channel signal in attribution window.

## 12. Data Schema and Taxonomy
### 12.1 Required Event Schema (Initial)
1. `install`
2. `signup`
3. `trial_start`
4. `purchase`
5. `subscription_start`
6. `subscription_renewal`

Required fields:
- `event_name`
- `event_timestamp`
- `app_id`
- `platform` (`ios` or `android`)
- `device_id` (where permitted)
- `user_id` (optional but recommended)
- `event_value` (optional numeric)
- `currency` (if revenue event)

### 12.2 Channel Taxonomy
Standardized fields:
- `source` (example: `tiktok`, `instagram`, `youtube`)
- `channel` (example: `paid_social`, `influencer`, `organic_social`)
- `campaign`
- `adset`
- `creative`
- `influencer_id`
- `link_id`

### 12.3 Governance
- Controlled vocab for `source` and `channel` to reduce reporting fragmentation.
- Validation in link builder to prevent malformed naming.

## 13. Reporting and Dashboards
### 13.1 Dashboard Views (MVP)
1. Acquisition Overview
2. Channel Performance
3. Campaign Breakdown
4. Influencer Performance
5. Revenue and ROAS Summary

### 13.2 Core Metrics
- Clicks
- Installs
- Cost (manual upload or integration in MVP+)
- CPI
- Signups
- Purchases
- Revenue
- CAC / CPA
- ROAS

### 13.3 Export and API
- CSV export for all dashboard tables in MVP.
- Reporting API for raw pulls is post-MVP.

## 14. Pricing and Packaging (Draft)
Pricing must support cost-disruption strategy while preserving margin at scale.

### 14.1 Principles
1. Transparent tiers.
2. Predictable pricing with clear included usage.
3. No hidden "must-buy" add-ons for basic functionality.

### 14.2 Draft Plans
1. Starter: low monthly fee, install/event caps, 3 seats.
2. Growth: higher caps, unlimited seats, priority support.
3. Scale: custom limits, SLA, advanced support.

### 14.3 Monetization Unit
- Primary: monthly platform fee.
- Secondary: usage overage (events or attributed installs).

## 15. Security, Privacy, and Compliance
### 15.1 Security Requirements
- Encrypted data in transit and at rest.
- Role-based access control.
- Audit logging for sensitive changes.
- Secrets managed in secure vault.

### 15.2 Privacy Requirements
- Consent-aware collection based on platform requirements.
- Data minimization for PII.
- Retention controls and deletion workflow.
- User-facing privacy documentation.

### 15.3 Compliance Milestones
- MVP: baseline privacy/legal coverage.
- Post-MVP: SOC 2 Type I planning.

## 16. Technical Architecture (High Level)
### 16.1 Components
1. Landing frontend
2. Web app frontend
3. Auth and workspace service
4. Link service + redirect service
5. Event ingestion API
6. Attribution processor
7. Reporting service
8. Billing service

### 16.2 Data Stores
- Transactional DB for configuration and users.
- Event store for click/install/event logs.
- Analytics warehouse for reporting aggregation.

### 16.3 Processing
- Stream or queue-based ingestion.
- Batch + near-real-time aggregation jobs.

## 17. QA Strategy (PM + QA Hybrid Model)
### 17.1 Test Layers
1. Unit tests for attribution rules and parameter parsing.
2. Integration tests for end-to-end click-to-install-to-dashboard pipeline.
3. E2E tests for onboarding, link creation, and reporting.
4. Manual exploratory testing for landing conversion flows and edge cases.

### 17.2 Environments
- Local dev
- Staging with synthetic campaign data
- Production with feature flags

### 17.3 UAT Exit Criteria
1. All P0/P1 defects closed.
2. Pilot campaign data aligns with expected attribution logic.
3. Signup funnel and in-app onboarding meet completion targets.

### 17.4 Regression Checklist (MVP)
- Link generation and redirect behavior.
- Attribution window logic.
- Dashboard filters and totals.
- Export correctness.
- Permission boundaries by role.
- Billing usage calculations.

## 18. Rollout Plan
### Phase 1: Internal Alpha
- Internal dogfooding with synthetic traffic and test installs.
- Validate data integrity and dashboard correctness.

### Phase 2: Design Partner Beta
- 5-10 partner apps with mixed channel setups.
- Weekly discrepancy and feedback review.

### Phase 3: Public GA
- Open signup.
- Publish documentation and onboarding guides.
- Monitor reliability and support load.

## 19. Roadmap (First 2 Quarters)
### Quarter 1 (MVP)
- Landing page
- Core web app
- Link tracking + attribution core
- Dashboard + exports
- Basic billing

### Quarter 2 (Post-MVP)
- Ad network cost integrations
- Reporting API
- Cohort retention views
- Improved alerting and anomaly detection
- SSO and enterprise admin controls

## 20. Risks and Mitigations
1. Risk: Attribution discrepancies reduce trust.
- Mitigation: transparent definitions, discrepancy documentation, and reconciliation tools.

2. Risk: Platform changes impact attribution signals.
- Mitigation: modular adapters and scheduled compatibility reviews.

3. Risk: Price pressure impacts margins.
- Mitigation: usage-based overage and disciplined infra cost monitoring.

4. Risk: Setup friction hurts activation.
- Mitigation: onboarding wizard, templates, copy-paste SDK guides, and implementation checklists.

## 21. Dependencies
- Mobile SDK implementation support.
- Reliable event ingestion and queue infrastructure.
- Legal review for privacy/terms.
- Payment provider integration for subscription billing.

## 22. Open Questions
1. Which billing unit should be primary for overage: installs, events, or MAU? (Events)
2. Should cost ingestion from ad networks be included in MVP or Q2? (MVP)
3. What level of historical data backfill is required at launch? 
4. Is self-serve onboarding enough, or is setup support required for first cohort?
5. Which channels are must-have for GA beyond TikTok, Meta, and influencer links?

## 23. Launch Readiness Checklist
- Product requirements signed off.
- Event schema finalized.
- Attribution rules documented and tested.
- Pricing page and billing flows QA complete.
- Legal pages published.
- Monitoring and alerting in place.
- Support playbook and troubleshooting docs ready.

