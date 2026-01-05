/**
 * Match Types for Admin Portal
 */

export type MatchStage = 'FINAL' | 'GROUP';
export type MatchStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface GameScore {
  game: number;
  player1Score: number;
  player2Score: number;
  duration?: number;
}

export interface MatchParticipant {
  id: string;
  participantId: string;
  position: number;
  isWinner?: boolean | null;
  score?: string | null;
  participant?: {
    id: string;
    displayName?: string | null;
    isVirtual?: boolean;
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
    } | null;
  };
}

export interface MatchGroupInfo {
  id: string;
  name: string;
  displayName: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  groupId?: string | null;
  stage: MatchStage;
  round: number;
  matchNumber: number;
  bracketPosition?: number | null;
  matchDate?: string | null;
  courtNumber?: string | null;
  status: MatchStatus;
  winnerId?: string | null;
  finalScore?: string | null;
  gameScores?: GameScore[] | null;
  isPlacementMatch?: boolean;
  placementRank?: number | null;
  createdAt?: string;
  updatedAt?: string;
  participants: MatchParticipant[];
  group?: MatchGroupInfo | null;
}

export interface PaginatedMatches {
  data: TournamentMatch[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MatchStats {
  total: number;
  byStage: Array<{ stage: MatchStage; count: number }>;
  byStatus: Array<{ status: MatchStatus; count: number }>;
}
