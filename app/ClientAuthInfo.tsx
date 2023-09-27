'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function ClientComponent() {
  const { data: session } = useSession();

  if (!session) {
    return <div><button onClick={() => signIn('shopify')}>Sign in</button></div>;
  }

  return (
    <div>
        <button onClick={() => signOut()}>Sign out</button>
        <pre>{`Hello ${session.user?.name}`}</pre>
    </div>
  );
}