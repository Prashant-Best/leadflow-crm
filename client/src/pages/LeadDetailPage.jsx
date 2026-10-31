import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { activitiesApi } from '../api/activities';
import { leadsApi } from '../api/leads';
import ActivityForm from '../components/ActivityForm';
import ActivityList from '../components/ActivityList';
import { Alert, EmptyState, PageHeader, Spinner, StageBadge } from '../components/ui';
import { LEAD_STAGES } from '../constants/enums';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { parseApiError } from '../utils/apiError';
import { formatBudget, formatDateTime } from '../utils/format';

const byDueDate = (a, b) => new Date(a.dueAt) - new Date(b.dueAt);

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [stageStatus, setStageStatus] = useState('');
  const [completingId, setCompletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useFlashMessage();

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [leadData, activityData] = await Promise.all([leadsApi.get(id), activitiesApi.list({ leadId: id })]);
      setLead(leadData);
      setActivities(activityData);
    } catch (err) {
      setLoadError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStageChange = async (event) => {
    const newStage = event.target.value;
    const previous = lead;
    setLead({ ...lead, stage: newStage });
    setStageStatus('saving');
    setActionError('');
    try {
      setLead(await leadsApi.update(id, { stage: newStage }));
      setStageStatus('saved');
    } catch (err) {
      setLead(previous);
      setStageStatus('');
      setActionError(`Could not change stage: ${parseApiError(err).message}`);
    }
  };

  const handleCreateActivity = async (payload) => {
    const created = await activitiesApi.create(payload);
    setActivities((current) => [...current, created].sort(byDueDate));
    setFlash('Follow-up added.');
  };

  const handleComplete = async (activityId) => {
    setCompletingId(activityId);
    setActionError('');
    try {
      const updated = await activitiesApi.complete(activityId);
      setActivities((current) => current.map((item) => (item.id === activityId ? updated : item)));
    } catch (err) {
      setActionError(`Could not complete follow-up: ${parseApiError(err).message}`);
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${lead.name}" and all of its follow-ups? This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(true);
    setActionError('');
    try {
      await leadsApi.remove(id);
      navigate('/leads', { state: { flash: `Deleted "${lead.name}" and its follow-ups.` } });
    } catch (err) {
      setActionError(parseApiError(err).message);
      setDeleting(false);
    }
  };

  if (loading && !lead) return <Spinner label="Loading lead…" />;

  if (loadError && !lead) {
    return (
      <>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/leads">Leads</Link>
        </nav>
        <Alert onRetry={loadData}>{loadError}</Alert>
      </>
    );
  }

  const pendingCount = activities.filter((a) => a.status === 'Pending').length;

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/leads">Leads</Link> <span aria-hidden="true">/</span> {lead.name}
      </nav>
      <PageHeader
        title={lead.name}
        subtitle={lead.company || 'No company'}
        actions={
          <>
            <Link to={`/leads/${id}/edit`} className="btn btn--ghost">
              Edit
            </Link>
            <button type="button" className="btn btn--danger-ghost" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      />

      <Alert type="success" onDismiss={() => setFlash('')}>
        {flash}
      </Alert>
      <Alert onDismiss={() => setActionError('')}>{actionError}</Alert>

      <div className="detail-grid">
        <section className="card">
          <div className="card-header">
            <h2>Pipeline stage</h2>
            <StageBadge stage={lead.stage} />
          </div>
          <div className="field">
            <label htmlFor="stage-select">Move this lead to</label>
            <select
              id="stage-select"
              value={lead.stage}
              onChange={handleStageChange}
              disabled={stageStatus === 'saving'}
            >
              {LEAD_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
            <small className="field-hint" aria-live="polite">
              {stageStatus === 'saving' && 'Saving…'}
              {stageStatus === 'saved' && 'Stage saved.'}
            </small>
          </div>
          <ol className="stage-steps" aria-label="Stage progress">
            {LEAD_STAGES.map((stage) => (
              <li key={stage} className={stage === lead.stage ? 'is-current' : undefined}>
                {stage}
              </li>
            ))}
          </ol>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Details</h2>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{lead.phone ? <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a> : '—'}</dd>
            </div>
            <div>
              <dt>Service interest</dt>
              <dd>{lead.serviceInterest}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{lead.source}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{formatBudget(lead.budget)}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{formatDateTime(lead.createdAt)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDateTime(lead.updatedAt)}</dd>
            </div>
          </dl>
          {lead.notes && (
            <div className="notes-block">
              <h3>Notes</h3>
              <p>{lead.notes}</p>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-header">
          <h2>Follow-ups</h2>
          <span className="muted small">
            {activities.length} total · {pendingCount} pending
          </span>
        </div>
        <ActivityForm leadId={id} onCreated={handleCreateActivity} />
        {activities.length === 0 ? (
          <EmptyState title="No follow-ups yet" description="Schedule a call, email or meeting above." />
        ) : (
          <ActivityList
            activities={activities}
            onComplete={handleComplete}
            completingId={completingId}
            showLead={false}
          />
        )}
      </section>
    </>
  );
}
