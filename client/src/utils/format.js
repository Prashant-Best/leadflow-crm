// Dates are stored in UTC by the API and shown here in the browser's local timezone.

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const UNITS = [
  ['day', 86400000],
  ['hour', 3600000],
  ['minute', 60000],
];

// "in 2 days", "3 hours ago", "now"
export function formatRelative(value) {
  if (!value) return '';
  const diff = new Date(value).getTime() - Date.now();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return relativeFormatter.format(Math.round(diff / ms), unit);
  }
  return 'now';
}

// Value for <input type="datetime-local"> in the user's local time.
export function toLocalInputValue(date) {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// datetime-local values have no timezone; the browser reads them as local time.
// toISOString() turns that into an unambiguous UTC string for the API.
export function localInputToIso(value) {
  return new Date(value).toISOString();
}

// Budgets are assumed to be in Indian Rupees.
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatBudget(value) {
  return value === null || value === undefined ? '—' : currencyFormatter.format(value);
}
