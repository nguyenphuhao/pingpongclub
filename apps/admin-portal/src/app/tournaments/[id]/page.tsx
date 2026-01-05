import { TournamentDetailClient } from './tournament-detail-client';

interface TournamentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  return <TournamentDetailClient tournamentId={params.id} />;
}
