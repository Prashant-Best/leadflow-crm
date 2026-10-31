import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { leadsApi } from '../api/leads';
import { LEAD_STAGES } from '../constants/enums';
import { useDebounce } from '../hooks/useDebounce';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { parseApiError } from '../utils/apiError';
import { formatBudget, formatDate } from '../utils/format';
import { Alert, EmptyState, PageHeader, Spinner, StageBadge } from '../components/ui';

// "Active" is not a stored stage: it means every stage except Won and Lost.
const ACTIVE_FILTER = 'Active';

export default function LeadsPage() {
  // Search and stage live in the URL so links like /leads?stage=Won work
  // and the filters survive a page refresh.
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');
  const stage = stageParam === ACTIVE_FILTER || LEAD_STAGES.includes(stageParam) ? stageParam : '';
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const search = useDebounce(searchText.trim(), 300);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [flash, setFlash] = useFlashMessage();

  const updateParam = useCallback(
    (key, value) => {
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    updateParam('search', search);
  }, [search, updateParam]);

  // Only the newest request may update the list, so a slow older response
  // cannot overwrite the results of a filter chosen later.
  const latestRequest = useRef(0);

  const loadLeads = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (stage === ACTIVE_FILTER) params.active = 'true';
      else if (stage) params.stage = stage;
      const items = await leadsApi.list(params);
      if (requestId === latestRequest.current) setLeads(items);
    } catch (err) {
      if (requestId === latestRequest.current) setError(parseApiError(err).message);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [search, stage]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleDelete = async (lead) => {
    const confirmed = window.confirm(`Delete "${lead.name}" and all of its follow-ups? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(lead.id);
    setError('');
    try {
      const result = await leadsApi.remove(lead.id);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setFlash(
        `Deleted "${lead.name}"${result.deletedActivities ? ` and ${result.deletedActivities} follow-up(s)` : ''}.`
      );
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = Boolean(search || stage);
  const clearFilters = () => {
    setSearchText('');
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Everyone who has shown interest in your services."
        actions={
          <Link to="/leads/new" className="btn btn--primary">
            Add lead
          </Link>
        }
      />

      <Alert type="success" onDismiss={() => setFlash('')}>
        {flash}
      </Alert>

      <div className="filters card">
        <div className="field">
          <label htmlFor="lead-search">Search</label>
          <input
            id="lead-search"
            type="search"
            placeholder="Name or company"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            maxLength={100}
          />
        </div>
        <div className="field">
          <label htmlFor="lead-stage-filter">Stage</label>
          <select id="lead-stage-filter" value={stage} onChange={(event) => updateParam('stage', event.target.value)}>
            <option value="">All stages</option>
            <option value={ACTIVE_FILTER}>Active (not Won or Lost)</option>
            {LEAD_STAGES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button type="button" className="btn btn--ghost filters-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <Alert onRetry={loadLeads}>{error}</Alert>

      {loading && leads.length === 0 ? (
        <Spinner label="Loading leads…" />
      ) : !error && leads.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No leads match your filters"
            description="Try a different name, company or stage."
            action={
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No leads yet"
            description="Add your first enquiry to start building your pipeline."
            action={
              <Link to="/leads/new" className="btn btn--primary">
                Add your first lead
              </Link>
            }
          />
        )
      ) : (
        leads.length > 0 && (
          <div className={loading ? 'card table-card is-refreshing' : 'card table-card'}>
            <div className="table-meta muted small">
              Showing {leads.length} lead{leads.length === 1 ? '' : 's'}
              {loading && ' · Updating…'}
            </div>
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Stage</th>
                    <th scope="col" className="hide-md">
                      Interest
                    </th>
                    <th scope="col">Budget</th>
                    <th scope="col" className="hide-md">
                      Added
                    </th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td data-label="Name">
                        <Link to={`/leads/${lead.id}`} className="link-strong">
                          {lead.name}
                        </Link>
                        {lead.company && <div className="muted small">{lead.company}</div>}
                      </td>
                      <td data-label="Contact" className="cell-wrap">
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div className="muted small">{lead.phone}</div>}
                      </td>
                      <td data-label="Stage">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td data-label="Interest" className="hide-md">
                        {lead.serviceInterest}
                        <div className="muted small">via {lead.source}</div>
                      </td>
                      <td data-label="Budget">{formatBudget(lead.budget)}</td>
                      <td data-label="Added" className="hide-md">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="cell-actions">
                        <Link to={`/leads/${lead.id}`} className="btn btn--small btn--ghost">
                          View
                        </Link>
                        <Link to={`/leads/${lead.id}/edit`} className="btn btn--small btn--ghost">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn--small btn--danger-ghost"
                          onClick={() => handleDelete(lead)}
                          disabled={deletingId === lead.id}
                        >
                          {deletingId === lead.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </>
  );
}
