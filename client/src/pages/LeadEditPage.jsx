import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { leadsApi } from '../api/leads';
import LeadForm from '../components/LeadForm';
import { Alert, PageHeader, Spinner } from '../components/ui';
import { parseApiError } from '../utils/apiError';

export default function LeadEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLead(await leadsApi.get(id));
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  const handleSubmit = async (payload) => {
    await leadsApi.update(id, payload);
    navigate(`/leads/${id}`, { state: { flash: 'Lead updated.' } });
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/leads">Leads</Link> <span aria-hidden="true">/</span>{' '}
        {lead ? <Link to={`/leads/${id}`}>{lead.name}</Link> : 'Lead'} <span aria-hidden="true">/</span> Edit
      </nav>
      <PageHeader title="Edit lead" subtitle={lead ? `Update details for ${lead.name}.` : undefined} />

      {loading && <Spinner label="Loading lead…" />}
      <Alert onRetry={loadLead}>{error}</Alert>
      {lead && (
        <LeadForm
          initialLead={lead}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/leads/${id}`)}
        />
      )}
    </>
  );
}
