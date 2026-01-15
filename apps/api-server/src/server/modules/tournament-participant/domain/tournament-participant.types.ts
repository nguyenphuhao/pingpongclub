import { TournamentParticipant } from '@pingclub/database';

export interface GetTournamentParticipantsQuery {
  page?: number;
  limit?: number;
  search?: string | null;
  status?: string | null;
  orderBy?: 'createdAt' | 'displayName' | 'seed';
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

export type TournamentParticipantEntity = TournamentParticipant;
