import { getMembers, getMemberStatistics } from './actions';
import { MembersClient } from './members-client';

interface MembersPageProps {
  searchParams: {
    search?: string;
    rank?: string;
    status?: string;
    gender?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export const metadata = {
  title: 'Quản lý Thành viên',
  description: 'Quản lý thành viên câu lạc bộ',
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const page = Number(searchParams.page) || 1;
  const rank = searchParams.rank && searchParams.rank !== 'all' ? searchParams.rank : undefined;
  const status = searchParams.status && searchParams.status !== 'all' ? searchParams.status : 'ACTIVE'; // Default to active
  const gender = searchParams.gender && searchParams.gender !== 'all' ? searchParams.gender : undefined;

  // Fetch members and statistics in parallel
  const [membersResult, stats] = await Promise.all([
    getMembers({
      page,
      limit: 20,
      search: searchParams.search,
      rank: rank as any,
      status: status as any,
      gender: gender as any,
      sortBy: searchParams.sortBy || 'createdAt',
      sortOrder: searchParams.sortOrder || 'desc',
    }),
    getMemberStatistics(),
  ]);

  return (
    <MembersClient
      initialMembers={membersResult.data}
      initialPagination={membersResult.pagination}
      initialStats={stats}
      searchParams={searchParams}
    />
  );
}

