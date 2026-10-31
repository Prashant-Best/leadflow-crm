import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';
import { Alert, Field } from '../components/ui';
import AuthLayout from './AuthLayout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = 'Name must be 2-60 characters';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address';
  if (values.password.length < 8 || values.password.length > 72) errors.password = 'Password must be 8-72 characters';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
      // On success PublicOnlyRoute redirects to the dashboard.
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  };

  const inputProps = (name) => ({
    id: `register-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    'aria-invalid': Boolean(errors[name]),
  });

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking leads in under a minute.">
      <form onSubmit={handleSubmit} noValidate className="form">
        <Alert>{formError}</Alert>

        <Field id="register-name" label="Full name" required error={errors.name}>
          <input {...inputProps('name')} type="text" autoComplete="name" maxLength={60} />
        </Field>
        <Field id="register-email" label="Email" required error={errors.email}>
          <input {...inputProps('email')} type="email" autoComplete="email" />
        </Field>
        <Field id="register-password" label="Password" required error={errors.password} hint="At least 8 characters">
          <input {...inputProps('password')} type="password" autoComplete="new-password" maxLength={72} />
        </Field>
        <Field id="register-confirmPassword" label="Confirm password" required error={errors.confirmPassword}>
          <input {...inputProps('confirmPassword')} type="password" autoComplete="new-password" maxLength={72} />
        </Field>

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
