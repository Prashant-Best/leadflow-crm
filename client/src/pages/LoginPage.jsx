import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';
import { Alert, Field } from '../components/ui';
import AuthLayout from './AuthLayout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login, sessionMessage } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
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
    if (!EMAIL_PATTERN.test(values.email.trim())) clientErrors.email = 'Enter a valid email address';
    if (!values.password) clientErrors.password = 'Password is required';
    setErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      // On success PublicOnlyRoute redirects to the page the user wanted.
      await login({ email: values.email.trim(), password: values.password });
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your leads and follow-ups.">
      <form onSubmit={handleSubmit} noValidate className="form">
        <Alert type="info">{!formError && sessionMessage}</Alert>
        <Alert>{formError}</Alert>

        <Field id="login-email" label="Email" required error={errors.email}>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field id="login-password" label="Password" required error={errors.password}>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="auth-switch">
        New to LeadFlow? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
