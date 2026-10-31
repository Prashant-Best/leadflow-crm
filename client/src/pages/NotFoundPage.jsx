import { Link } from 'react-router';
import { EmptyState } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist or was moved."
        action={
          <Link to="/dashboard" className="btn btn--primary">
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
