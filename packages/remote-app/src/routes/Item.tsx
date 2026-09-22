import { useNavigate } from '@tanstack/react-router';
import { itemRoute } from '../App';
import { useHostNavigate } from '../navigation';

export function Item() {
  const { id } = itemRoute.useParams();
  const navigate = useNavigate();
  const hostNavigate = useHostNavigate();
  const n = Number(id) || 0;
  return (
    <div>
      <h2>Item {id}</h2>
      <p>Dynamic segment resolved by the remote router.</p>
      <button type="button" onClick={() => navigate({ to: `/items/${n + 1}` })}>
        Next item (programmatic navigate)
      </button>{' '}
      <button type="button" onClick={() => window.history.back()}>
        Back (history)
      </button>{' '}
      <button type="button" onClick={() => hostNavigate('/')}>
        Host home (useHostNavigate)
      </button>
    </div>
  );
}
