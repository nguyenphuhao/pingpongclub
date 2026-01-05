import { TournamentsClient } from './tournaments-client';

export default async function TournamentsPage() {
  // In production, fetch initial data server-side
  // For now, pass empty array and let client fetch
  return (
    <TournamentsClient
      initialTournaments={[]}
      initialPagination={{
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      }}
    />
  );
}
