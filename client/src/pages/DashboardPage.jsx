import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { dashboardApi } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';
import { formatDateTime, formatRelative } from '../utils/format';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../components/ui';

function MetricCard({ label, value, hint, tone = 'default', to }) {
  return (
    <Link to={to} className={`metric-card metric-card--${tone}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {hint && <span className="metric-hint">{hint}</span>}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await dashboardApi.summary());
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const firstName = user.name.split(' ')[0];
  const maxStageCount = summary ? Math.max(1, ...summary.leadsByStage.map((s) => s.count)) : 1;

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle="Here is how your pipeline looks right now."
        actions={
          <>
            <Link to="/leads" className="btn btn--ghost">
              View leads
            </Link>
            <Link to="/leads/new" className="btn btn--primary">
              Add lead
            </Link>
          </>
        }
      />

      {loading && !summary && <Spinner label="Loading dashboard…" />}
      <Alert onRetry={loadSummary}>{error}</Alert>

      {summary && (
        <>
          <section className="metrics-grid" aria-label="Key metrics">
            <MetricCard label="Total leads" value={summary.totalLeads} to="/leads" />
            <MetricCard
              label="Active leads"
              value={summary.activeLeads}
              hint="Not Won or Lost"
              tone="info"
              to="/leads?stage=Active"
            />
            <MetricCard label="Won leads" value={summary.wonLeads} tone="success" to="/leads?stage=Won" />
            <MetricCard
              label="Pending follow-ups"
              value={summary.pendingFollowUps}
              hint={`${summary.completedFollowUps} completed`}
              tone="warning"
              to="/follow-ups?filter=pending"
            />
            <MetricCard
              label="Overdue follow-ups"
              value={summary.overdueFollowUps}
              hint="Pending and past due"
              tone={summary.overdueFollowUps > 0 ? 'danger' : 'default'}
              to="/follow-ups?filter=overdue"
            />
          </section>

          <div className="dashboard-columns">
            <section className="card">
              <div className="card-header">
                <h2>Pipeline by stage</h2>
                <span className="muted small">{summary.totalLeads} leads</span>
              </div>
              <ul className="stage-bars">
                {summary.leadsByStage.map(({ stage, count }) => (
                  <li key={stage}>
                    <Link to={`/leads?stage=${encodeURIComponent(stage)}`} className="stage-bar-row">
                      <span className="stage-bar-label">{stage}</span>
                      <span className="stage-bar-track">
                        <span
                          className={`stage-bar-fill stage-fill--${stage.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{ width: `${(count / maxStageCount) * 100}%` }}
                        />
                      </span>
                      <span className="stage-bar-count">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Next follow-ups</h2>
                <Link to="/follow-ups" className="small">
                  See all
                </Link>
              </div>
              {summary.upcomingFollowUps.length === 0 ? (
                <EmptyState
                  title="Nothing scheduled"
                  description="Open a lead and add a follow-up to see it here."
                />
              ) : (
                <ul className="upcoming-list">
                  {summary.upcomingFollowUps.map((activity) => (
                    <li key={activity.id}>
                      <div>
                        <strong>{activity.title}</strong>
                        <div className="muted small">
                          {activity.type} ·{' '}
                          {activity.leadId ? (
                            <Link to={`/leads/${activity.leadId.id}`}>{activity.leadId.name}</Link>
                          ) : (
                            'Deleted lead'
                          )}
                        </div>
                      </div>
                      <div className="upcoming-meta">
                        <StatusBadge activity={activity} />
                        <span className="muted small" title={formatDateTime(activity.dueAt)}>
                          {formatRelative(activity.dueAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <p className="muted small updated-at">Updated {formatDateTime(summary.generatedAt)}</p>
        </>
      )}
    </>
  );
}
