import { getUserById, getLoginHistory, getActiveSessions } from '../actions';
import { UserDetailsClient } from './user-details-client';
import { notFound } from 'next/navigation';

interface UserDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  try {
    const [user, loginHistory, activeSessions] = await Promise.all([
      getUserById(params.id),
      getLoginHistory(params.id),
      getActiveSessions(params.id),
    ]);

    return (
      <UserDetailsClient
        initialUser={user}
        initialLoginHistory={loginHistory}
        initialActiveSessions={activeSessions}
      />
    );
  } catch (error: any) {
    if (error.message === 'User not found') {
      notFound();
    }
    throw error;
  }
}

