import { Link, useLocation } from '@tanstack/react-router';

export function NotFound() {
  const location = useLocation();
  return (
    <div>
      <h2>Remote 404</h2>
      <p>
        No remote route matches <code>{location.pathname}</code>. Handled by the remote, not the host.
      </p>
      <Link to="/">Remote home</Link>
    </div>
  );
}
