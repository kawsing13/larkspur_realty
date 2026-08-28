import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-ink-soft">404</p>
      <h1 className="mt-2 text-3xl">We could not find that page</h1>
      <p className="mt-2 text-ink-soft">
        The link may be old, or the listing may have been taken down.
      </p>
      <Button as={Link} to="/" className="mt-6">
        Go to the homepage
      </Button>
    </div>
  );
}
