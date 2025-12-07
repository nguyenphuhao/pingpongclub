import { getUsers } from './actions';
import { UsersClient } from './users-client';

interface UsersPageProps {
  searchParams: {
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const page = Number(searchParams.page) || 1;
  const role = searchParams.role && searchParams.role !== 'all' ? searchParams.role : undefined;
  const status = searchParams.status && searchParams.status !== 'all' ? searchParams.status : undefined;

  const result = await getUsers({
    page,
    limit: 10,
    search: searchParams.search,
    role: role as any,
    status: status as any,
  });

  return (
    <UsersClient
      initialUsers={result.data}
      initialMeta={result.meta}
      searchParams={searchParams}
    />
  );
}

