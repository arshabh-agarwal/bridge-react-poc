import { useNavigate, useParams } from 'react-router';

export function Item() {
  const { id } = useParams();
  const navigate = useNavigate();
  const n = Number(id) || 0;
  return (
    <div>
      <h2>Item {id}</h2>
      <p>Dynamic segment resolved by the remote router.</p>
      <button type="button" onClick={() => navigate(`/items/${n + 1}`)}>
        Next item (programmatic navigate)
      </button>{' '}
      <button type="button" onClick={() => navigate(-1)}>
        Back (history)
      </button>
    </div>
  );
}
