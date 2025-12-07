import { cookies } from 'next/headers';
import { getAdminUser } from './auth';

export interface SessionData {
  id: string;
  username: string;
  role: string;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;

    if (!sessionToken) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    return decoded as SessionData;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin() {
  const session = await getSession();
  if (!session) return null;

  return await getAdminUser(session.id);
}

