import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { activitiesApi } from '../api/activities';
import ActivityList from '../components/ActivityList';
import { Alert, EmptyState, PageHeader, Spinner } from '../components/ui';
import { parseApiError } from '../utils/apiError';

// Each tab maps to the query parameters sent to GET /activities.
const FILTERS = {
  all: { label: 'All', params: {} },
  pending: { label: 'Pending', params: { status: 'Pending' } },
  overdue: { label: 'Overdue', params: { overdue: 'true' } },
  completed: { label: 'Completed', params: { status: 'Completed' } },
};

export default function FollowUpsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS[searchParams.get('filter')] ? searchParams.get('filter') : 'all';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingId, setCompletingId] = useState(null);

  // Only the newest request may update the list (fast tab switching).
  const latestRequest = useRef(0);

  const loadActivities = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const items = await activitiesApi.list(FILTERS[filter].params);
      if (requestId === latestRequest.current) setActivities(items);
    } catch (err) {
      if (requestId === latestRequest.current) setError(parseApiError(err).message);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleComplete = async (activityId) => {
    setCompletingId(activityId);
    setError('');
    try {
      const updated = await activitiesApi.complete(activityId);
      setActivities((current) =>
        // A completed item no longer belongs in the Pending/Overdue tabs.
        filter === 'pending' || filter === 'overdue'
          ? current.filter((item) => item.id !== activityId)
          : current.map((item) => (item.id === activityId ? updated : item))
      );
    } catch (err) {
      setError(`Could not complete follow-up: ${parseApiError(err).message}`);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Follow-ups" subtitle="Calls, emails, meetings and tasks across all your leads." />

      <div className="tabs" role="tablist" aria-label="Filter follow-ups">
        {Object.entries(FILTERS).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={filter === key ? 'tab is-active' : 'tab'}
            onClick={() => setSearchParams(key === 'all' ? {} : { filter: key }, { replace: true })}
          >
            {label}
          </button>
        ))}
      </div>

      <Alert onRetry={loadActivities}>{error}</Alert>

      {loading ? (
        <Spinner label="Loading follow-ups…" />
      ) : !error && activities.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No follow-ups yet' : `No ${FILTERS[filter].label.toLowerCase()} follow-ups`}
          description={
            filter === 'all'
              ? 'Follow-ups are created from a lead’s page.'
              : 'Nice - nothing to show in this view right now.'
          }
          action={
            filter === 'all' && (
              <Link to="/leads" className="btn btn--primary">
                Go to leads
              </Link>
            )
          }
        />
      ) : (
        activities.length > 0 && (
          <div className="card table-card">
            <div className="table-meta muted small">
              Showing {activities.length} follow-up{activities.length === 1 ? '' : 's'}, soonest first
            </div>
            <ActivityList activities={activities} onComplete={handleComplete} completingId={completingId} />
          </div>
        )
      )}
    </>
  );
}
