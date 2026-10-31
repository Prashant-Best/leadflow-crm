import { Link } from 'react-router';
import { formatDateTime, formatRelative } from '../utils/format';
import { StatusBadge } from './ui';

// Table of follow-ups. On small screens each row is shown as a card (see CSS).
export default function ActivityList({ activities, onComplete, completingId, showLead = true }) {
  return (
    <div className="table-wrap">
      <table className="table table--responsive">
        <thead>
          <tr>
            {showLead && <th scope="col">Lead</th>}
            <th scope="col">Follow-up</th>
            <th scope="col">Type</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const lead = activity.leadId;
            return (
              <tr key={activity.id} className={activity.isOverdue ? 'row--overdue' : undefined}>
                {showLead && (
                  <td data-label="Lead">
                    {lead ? (
                      <Link to={`/leads/${lead.id}`} className="link-strong">
                        {lead.name}
                      </Link>
                    ) : (
                      <span className="muted">Deleted lead</span>
                    )}
                    {lead?.company && <div className="muted small">{lead.company}</div>}
                  </td>
                )}
                <td data-label="Follow-up">
                  <strong>{activity.title}</strong>
                  {activity.notes && <div className="muted small">{activity.notes}</div>}
                </td>
                <td data-label="Type">{activity.type}</td>
                <td data-label="Due">
                  {formatDateTime(activity.dueAt)}
                  {activity.status === 'Pending' && <div className="muted small">{formatRelative(activity.dueAt)}</div>}
                </td>
                <td data-label="Status">
                  <StatusBadge activity={activity} />
                  {activity.completedAt && (
                    <div className="muted small">Done {formatDateTime(activity.completedAt)}</div>
                  )}
                </td>
                <td className="cell-actions">
                  {activity.status === 'Pending' && (
                    <button
                      type="button"
                      className="btn btn--small btn--success"
                      onClick={() => onComplete(activity.id)}
                      disabled={completingId === activity.id}
                    >
                      {completingId === activity.id ? 'Saving…' : 'Mark complete'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
