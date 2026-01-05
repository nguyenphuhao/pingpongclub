/**
 * Participant Types
 */

export type ParticipantStatus = 'REGISTERED' | 'CHECKED_IN' | 'WITHDRAWN' | 'DISQUALIFIED';

export interface Participant {
  id: string;
  tournamentId: string;
  userId: string;
  groupId?: string;
  seed?: number;
  status: ParticipantStatus;
  finalRank?: number;
  displayName?: string | null;
  isVirtual?: boolean;
  createdAt: Date | string;
  // Relations
  user?: {
    id: string;
    email: string;
    phone?: string | null;
    fullName?: string;
    nickname?: string;
    displayName?: string;
    ratingPoints?: number;
    totalMatches?: number;
    winRate?: number;
  };
  group?: {
    id: string;
    name: string;
  };
}

export interface AddParticipantDto {
  userId: string;
  groupId?: string;
  seed?: number;
}

export interface UpdateParticipantDto {
  groupId?: string;
  seed?: number;
  status?: ParticipantStatus;
}

export interface BulkImportParticipantDto {
  userId: string;
  seed?: number;
}

export interface PaginatedParticipants {
  data: Participant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
