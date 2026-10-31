// Two-column frame shared by the login and register pages.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="brand brand--light">
          <img src="/favicon.svg" alt="" width="36" height="36" />
          <span>LeadFlow</span>
        </div>
        <div>
          <h2>Every enquiry, one simple pipeline.</h2>
          <p>
            Capture leads from your website, referrals and outreach, move them through each sales stage and never miss
            a follow-up.
          </p>
        </div>
        <ul className="auth-points">
          <li>Track leads from New to Won</li>
          <li>Schedule calls, emails and meetings</li>
          <li>See overdue follow-ups at a glance</li>
        </ul>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
