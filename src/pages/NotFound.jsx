import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/feedback';
import { PageHeader } from '../components/ui/data';

export default function NotFound({ inApp }) {
  return (
    <div style={inApp ? undefined : { maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <PageHeader title="Page not found" />
      <div className="card"><EmptyState icon="SearchX" title="That page does not exist" action={<Link className="btn btn-primary" to={inApp ? '/app' : '/'}>{inApp ? 'Back to dashboard' : 'Back to home'}</Link>}>
        Check the address, or use the navigation to find what you need.</EmptyState></div>
    </div>
  );
}
