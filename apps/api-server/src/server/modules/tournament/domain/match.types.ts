/**
 * Match Domain Types
 * Generic types for tournament matches (both FINAL and GROUP stages)
 */

import { MatchStatus, TournamentStage, ParticipantStatus } from '@prisma/client';
import { GameScore } from './group.types';

// ============================================
// Match Query DTOs
// ============================================

export interface MatchQueryDto {
  stage?: TournamentStage;  // 'FINAL' or 'GROUP'
  groupId?: string;         // Filter by group (for GROUP stage)
  status?: MatchStatus;     // Filter by status
  round?: number;           // Filter by round
  page?: number;
  limit?: number;
}

// ============================================
// Match Create DTOs
// ============================================

export interface CreateMatchDto {
  stage: TournamentStage;           // 'FINAL' or 'GROUP'
  groupId?: string;                 // Required if stage = 'GROUP'
  round: number;
  matchNumber: number;
  bracketPosition?: number;         // For bracket visualization
  matchDate?: Date | string;
  courtNumber?: string;
  status?: MatchStatus;             // Default: SCHEDULED
  isPlacementMatch?: boolean;       // For 3rd place match
  placementRank?: number;           // 3 for 3rd place match
  participants?: Array<{            // Optional: can create TBD match
    participantId: string;
    position: 1 | 2;
  }>;
}

/**
 * Unified Match Generation DTO
 * Replaces separate bracket/group generation endpoints
 */
export interface GenerateMatchesDto {
  stage: TournamentStage;           // 'FINAL' or 'GROUP'
  groupId?: string;                 // Required if stage = 'GROUP'

  // For FINAL stage (bracket)
  includeThirdPlaceMatch?: boolean; // Create 3rd place match

  // For GROUP stage
  matchupsPerPair?: number;         // Number of matches per pair (default: 1)
}

/**
 * Update Match DTO
 * For customizing match details and participants
 */
export interface UpdateMatchDto {
  // Schedule updates
  matchDate?: Date | string;        // Update match date/time
  courtNumber?: string;             // Update court assignment

  // Participant updates (swap matchup)
  participants?: Array<{
    participantId: string;
    position: 1 | 2;
  }>;
}

// ============================================
// Match Response DTOs
// ============================================

export interface MatchResponseDto {
  id: string;
  tournamentId: string;
  groupId: string | null;
  stage: TournamentStage;
  round: number;
  matchNumber: number;
  bracketPosition: number | null;
  matchDate: Date | null;
  courtNumber: string | null;
  status: MatchStatus;
  winnerId: string | null;
  finalScore: string | null;
  gameScores?: GameScore[];
  isPlacementMatch: boolean;
  placementRank: number | null;
  createdAt: Date;
  updatedAt: Date;
  participants: MatchParticipantResponseDto[];
  group?: {
    id: string;
    name: string;
    displayName: string;
  };
}

export interface MatchParticipantResponseDto {
  id: string;
  participantId: string;
  position: number;
  isWinner: boolean | null;
  score: string | null;
  participant: {
    id: string;
    tournamentId: string;
    userId: string | null;
    groupId: string | null;
    seed: number | null;
    status: ParticipantStatus;
    displayName: string | null;
    isVirtual: boolean;
    user?: {
      id: string;
      email: string;
      phone: string | null;
      firstName: string | null;
      lastName: string | null;
      nickname: string | null;
      displayName: string | null;
      ratingPoints: number | null;
    } | null;
  };
}

export interface PaginatedMatchesDto {
  data: MatchResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Match Statistics
// ============================================

export interface MatchStatsDto {
  total: number;
  byStage: Array<{
    stage: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}
