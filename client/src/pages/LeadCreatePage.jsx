import { Link, useNavigate } from 'react-router';
import { leadsApi } from '../api/leads';
import LeadForm from '../components/LeadForm';
import { PageHeader } from '../components/ui';

export default function LeadCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    const lead = await leadsApi.create(payload);
    navigate(`/leads/${lead.id}`, { state: { flash: 'Lead created. You can now schedule a follow-up.' } });
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/leads">Leads</Link> <span aria-hidden="true">/</span> New
      </nav>
      <PageHeader title="Add lead" subtitle="Capture a new enquiry. Fields marked * are required." />
      <LeadForm submitLabel="Create lead" onSubmit={handleSubmit} onCancel={() => navigate('/leads')} />
    </>
  );
}
