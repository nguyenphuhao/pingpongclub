import { Tournament } from '@pingclub/database';

export interface GetTournamentsQuery {
  page?: number;
  limit?: number;
  search?: string | null;
  orderBy?: 'createdAt' | 'name';
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type TournamentEntity = Tournament;
