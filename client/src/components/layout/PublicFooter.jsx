import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';

export function PublicFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-soft">
            A checked marketplace for homes to buy and rent, run by Larkspur Realty.
          </p>
          <p className="mt-3 text-sm text-ink-soft">318 NW Couch St, Portland, OR</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-ink-soft">
          <Link to="/search" className="hover:text-ink">
            Buy
          </Link>
          <Link to="/search?listingMode=RENT" className="hover:text-ink">
            Rent
          </Link>
          <Link to="/login" className="hover:text-ink">
            Agent sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-content px-4 py-4 text-xs text-ink-soft">
          &copy; {new Date().getFullYear()} Larkspur Realty
        </p>
      </div>
    </footer>
  );
}
