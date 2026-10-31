import { useState } from 'react';
import { LEAD_SOURCES, LEAD_STAGES, SERVICE_INTERESTS } from '../constants/enums';
import { parseApiError } from '../utils/apiError';
import { Alert, Field } from './ui';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

const EMPTY_LEAD = {
  name: '',
  company: '',
  email: '',
  phone: '',
  serviceInterest: 'Other',
  source: 'Other',
  budget: '',
  stage: 'New',
  notes: '',
};

function toFormValues(lead) {
  if (!lead) return EMPTY_LEAD;
  return {
    name: lead.name ?? '',
    company: lead.company ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    serviceInterest: lead.serviceInterest ?? 'Other',
    source: lead.source ?? 'Other',
    budget: lead.budget ?? '',
    stage: lead.stage ?? 'New',
    notes: lead.notes ?? '',
  };
}

// Same rules as the API, checked early so the user gets instant feedback.
// The server still validates everything again.
function validate(values) {
  const errors = {};
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (!values.name.trim()) errors.name = 'Lead name is required';
  else if (values.name.trim().length > 100) errors.name = 'Lead name must be at most 100 characters';

  if (!email && !phone) errors.email = 'Provide at least an email or a phone number';
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number (7-20 digits, may start with +)';

  if (values.budget !== '' && (Number.isNaN(Number(values.budget)) || Number(values.budget) < 0)) {
    errors.budget = 'Budget must be a number of 0 or more';
  }
  return errors;
}

// Only the editable fields are sent. Empty optional fields become null.
function toPayload(values) {
  const optional = (text) => text.trim() || null;
  return {
    name: values.name.trim(),
    company: optional(values.company),
    email: optional(values.email),
    phone: optional(values.phone),
    serviceInterest: values.serviceInterest,
    source: values.source,
    budget: values.budget === '' ? null : Number(values.budget),
    stage: values.stage,
    notes: optional(values.notes),
  };
}

export default function LeadForm({ initialLead, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(initialLead));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validate(values);
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  };

  const inputProps = (name) => ({
    id: `lead-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `lead-${name}-error` : undefined,
  });

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <Alert>{formError}</Alert>

      <div className="form-grid">
        <Field id="lead-name" label="Name" required error={errors.name}>
          <input {...inputProps('name')} type="text" maxLength={100} autoComplete="off" />
        </Field>
        <Field id="lead-company" label="Company" error={errors.company}>
          <input {...inputProps('company')} type="text" maxLength={100} autoComplete="off" />
        </Field>
        <Field id="lead-email" label="Email" error={errors.email} hint="Email or phone is required">
          <input {...inputProps('email')} type="email" autoComplete="off" />
        </Field>
        <Field id="lead-phone" label="Phone" error={errors.phone}>
          <input {...inputProps('phone')} type="tel" autoComplete="off" placeholder="+91 98765 43210" />
        </Field>
        <Field id="lead-serviceInterest" label="Service interest" error={errors.serviceInterest}>
          <select {...inputProps('serviceInterest')}>
            {SERVICE_INTERESTS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field id="lead-source" label="Source" error={errors.source}>
          <select {...inputProps('source')}>
            {LEAD_SOURCES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field id="lead-budget" label="Budget (₹)" error={errors.budget}>
          <input {...inputProps('budget')} type="number" min="0" step="any" inputMode="decimal" />
        </Field>
        <Field id="lead-stage" label="Stage" error={errors.stage}>
          <select {...inputProps('stage')}>
            {LEAD_STAGES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="lead-notes" label="Notes" error={errors.notes}>
        <textarea {...inputProps('notes')} rows={4} maxLength={1000} />
      </Field>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
