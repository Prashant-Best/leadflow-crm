import { useState } from 'react';
import { ACTIVITY_TYPES } from '../constants/enums';
import { parseApiError } from '../utils/apiError';
import { localInputToIso, toLocalInputValue } from '../utils/format';
import { Alert, Field } from './ui';

// Default due time: tomorrow at 10:00 local time.
function defaultDueAt() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toLocalInputValue(date);
}

const initialValues = () => ({ title: '', type: 'Call', dueAt: defaultDueAt(), notes: '' });

export default function ActivityForm({ leadId, onCreated }) {
  const [values, setValues] = useState(initialValues);
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
    const clientErrors = {};
    if (!values.title.trim()) clientErrors.title = 'Title is required';
    if (!values.dueAt) clientErrors.dueAt = 'Due date and time is required';
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await onCreated({
        leadId,
        title: values.title.trim(),
        type: values.type,
        dueAt: localInputToIso(values.dueAt),
        notes: values.notes.trim() || null,
      });
      setValues(initialValues());
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="activity-form" onSubmit={handleSubmit} noValidate>
      <Alert>{formError}</Alert>
      <div className="form-grid form-grid--activity">
        <Field id="activity-title" label="Title" required error={errors.title}>
          <input
            id="activity-title"
            name="title"
            type="text"
            maxLength={150}
            placeholder="e.g. Discovery call"
            value={values.title}
            onChange={handleChange}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>
        <Field id="activity-type" label="Type" error={errors.type}>
          <select id="activity-type" name="type" value={values.type} onChange={handleChange}>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
        <Field id="activity-dueAt" label="Due" required error={errors.dueAt}>
          <input
            id="activity-dueAt"
            name="dueAt"
            type="datetime-local"
            value={values.dueAt}
            onChange={handleChange}
            aria-invalid={Boolean(errors.dueAt)}
          />
        </Field>
      </div>
      <Field id="activity-notes" label="Notes" error={errors.notes}>
        <input
          id="activity-notes"
          name="notes"
          type="text"
          maxLength={1000}
          placeholder="Optional"
          value={values.notes}
          onChange={handleChange}
        />
      </Field>
      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add follow-up'}
        </button>
      </div>
    </form>
  );
}
