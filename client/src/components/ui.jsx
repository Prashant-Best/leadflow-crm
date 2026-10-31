// Small presentational building blocks shared across pages.

export function Spinner({ label = 'Loading…', fullPage = false }) {
  return (
    <div className={fullPage ? 'spinner-wrap spinner-wrap--page' : 'spinner-wrap'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}

export function Alert({ type = 'error', children, onRetry, onDismiss }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      <span className="alert-actions">
        {onRetry && (
          <button type="button" className="btn btn--small btn--ghost" onClick={onRetry}>
            Try again
          </button>
        )}
        {onDismiss && (
          <button type="button" className="alert-close" onClick={onDismiss} aria-label="Dismiss message">
            ×
          </button>
        )}
      </span>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

const stageSlug = (stage) => stage.toLowerCase().replace(/\s+/g, '-');

export function StageBadge({ stage }) {
  return <span className={`badge badge--stage-${stageSlug(stage)}`}>{stage}</span>;
}

export function StatusBadge({ activity }) {
  if (activity.status === 'Completed') return <span className="badge badge--completed">Completed</span>;
  if (activity.isOverdue) return <span className="badge badge--overdue">Overdue</span>;
  return <span className="badge badge--pending">Pending</span>;
}

// Label + input + error message, wired up for screen readers.
export function Field({ id, label, error, hint, required, children }) {
  return (
    <div className={error ? 'field field--error' : 'field'}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
