import { getTournaments } from './actions';
import { TournamentsClient } from './tournaments-client';

interface TournamentsPageProps {
  searchParams: {
    search?: string;
    page?: string;
    orderBy?: 'createdAt' | 'name';
    order?: 'asc' | 'desc';
  };
}

export const metadata = {
  title: 'Quản lý Giải đấu',
  description: 'Danh sách giải đấu và stage trong hệ thống',
};

export default async function TournamentsPage({ searchParams }: TournamentsPageProps) {
  const page = Number(searchParams.page) || 1;

  const tournamentsResult = await getTournaments({
    page,
    limit: 20,
    search: searchParams.search,
    orderBy: searchParams.orderBy || 'createdAt',
    order: searchParams.order || 'desc',
  });

  return (
    <TournamentsClient
      initialTournaments={tournamentsResult.data}
      initialPagination={tournamentsResult.pagination}
      searchParams={searchParams}
    />
  );
}
