import { getAuthSession } from '@/auth';

export default async function ServerAuthInfo() {
  const session = await getAuthSession();

  if (!session) {
    return 'no session';
  }

  return <pre>{JSON.stringify(session, null, 2)}</pre>;
}
