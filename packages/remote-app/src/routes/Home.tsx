import { useState } from 'react';

export function Home() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h2>Remote home</h2>
      <p>This route tree is owned by the remote. The host only knows the prefix.</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Local state: {count}
      </button>
    </div>
  );
}
