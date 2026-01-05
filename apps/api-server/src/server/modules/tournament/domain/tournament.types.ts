/**
 * Tournament Domain Types
 */

import {
  TournamentGameType,
  TournamentStatus,
  ParticipantStatus,
  GroupStatus,
  TournamentStage,
} from '@prisma/client';

// ============================================
// Tournament Configuration Types
// ============================================

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';
export type RankBy = 'MATCH_WINS' | 'POINTS';
export type PlacementMethod = 'PARTICIPANT_LIST_ORDER' | 'RANDOM' | 'SEEDED';
export type TieBreak = 'WINS_VS_TIED' | 'GAME_SET_DIFFERENCE' | 'POINTS_DIFFERENCE';

// ============================================
// Match Format Configuration
// ============================================

export interface MatchFormat {
  bestOf: 3 | 5 | 7; // Best of X sets (usually 3 or 5 for table tennis)
  pointsToWin: 11 | 21; // Points needed to win each set (11 standard, 21 old rules)
  deuceRule: boolean; // true = must win by 2 points from 10-10 (or 20-20)
  minLeadToWin: 2; // Minimum lead required to win a set (usually 2)
}

// Default match formats for convenience
export const DEFAULT_MATCH_FORMATS = {
  BEST_OF_3: {
    bestOf: 3,
    pointsToWin: 11,
    deuceRule: true,
    minLeadToWin: 2,
  } as MatchFormat,
  BEST_OF_5: {
    bestOf: 5,
    pointsToWin: 11,
    deuceRule: true,
    minLeadToWin: 2,
  } as MatchFormat,
  BEST_OF_7: {
    bestOf: 7,
    pointsToWin: 11,
    deuceRule: true,
    minLeadToWin: 2,
  } as MatchFormat,
};

// ============================================
// Export Group Types
// ============================================

export * from './group.types';

export interface SingleEliminationConfig {
  hasPlacementMatches: boolean; // true = tranh 3-4, false = đồng hạng 3
}

export interface RoundRobinConfig {
  matchupsPerPair: number; // participants play each other X times (usually 1)
  rankBy: RankBy;
  placementMethod: PlacementMethod;
  tieBreaks: TieBreak[];
}

export interface SingleStageConfig {
  format: TournamentFormat;
  matchFormat: MatchFormat; // Match format for all matches in single stage
  singleEliminationConfig?: SingleEliminationConfig;
  roundRobinConfig?: RoundRobinConfig;
}

export interface GroupStageConfig {
  format: 'ROUND_ROBIN';
  matchFormat: MatchFormat; // Match format for group stage matches
  participantsPerGroup: number; // default 4, max 20
  participantsAdvancing: number; // default 2
  matchupsPerPair: number;
  rankBy: RankBy;
  placementMethod: PlacementMethod;
  tieBreaks: TieBreak[];
}

export interface FinalStageConfig {
  format: 'SINGLE_ELIMINATION';
  matchFormat: MatchFormat; // Match format for final stage matches
  hasPlacementMatches: boolean;
}

export interface TwoStagesConfig {
  groupStage: GroupStageConfig;
  finalStage: FinalStageConfig;
}

// ============================================
// DTOs
// ============================================

export interface CreateTournamentDto {
  name: string;
  description?: string;
  game?: string;
  gameType: TournamentGameType;
  status?: TournamentStatus;  // Optional: defaults to PENDING if not specified
  registrationStartTime?: Date | string;
  isTentative?: boolean;
  singleStageConfig?: SingleStageConfig;
  twoStagesConfig?: TwoStagesConfig;
}

export interface UpdateTournamentDto {
  name?: string;
  description?: string;
  registrationStartTime?: Date | string;
  isTentative?: boolean;
  singleStageConfig?: SingleStageConfig;
  twoStagesConfig?: TwoStagesConfig;
}

export interface TournamentQueryDto {
  status?: TournamentStatus;
  gameType?: TournamentGameType;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'registrationStartTime';
  sortOrder?: 'asc' | 'desc';
}

export interface TournamentResponseDto {
  id: string;
  name: string;
  description?: string;
  game: string;
  gameType: TournamentGameType;
  status: TournamentStatus;
  registrationStartTime?: Date;
  isTentative: boolean;
  singleStageConfig?: SingleStageConfig;
  twoStagesConfig?: TwoStagesConfig;
  participantsLocked: boolean;
  challongeId?: string;
  challongeUrl?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Stats
  participantsCount?: number;
  matchesCount?: number;
}

export interface PaginatedTournamentsDto {
  data: TournamentResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Participant DTOs
// ============================================

export interface AddParticipantDto {
  userId: string;
  groupId?: string; // For two-stage tournaments
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

export interface ParticipantResponseDto {
  id: string;
  tournamentId: string;
  userId: string;
  groupId?: string;
  seed?: number;
  status: ParticipantStatus;
  finalRank?: number;
  createdAt: Date;
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

export interface PaginatedParticipantsDto {
  data: ParticipantResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Bracket Types (for @g-loot/react-tournament-brackets)
// ============================================

export type BracketMatchState = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BracketParticipantStatus = 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;

export interface BracketParticipant {
  id: string;
  resultText: string | null;
  isWinner: boolean;
  status: BracketParticipantStatus;
  name: string;
}

export interface BracketMatch {
  id: string;
  name: string;
  nextMatchId: string | null;
  nextLooserMatchId?: string | null; // Only for double elimination
  tournamentRoundText: string;
  startTime: string;
  state: BracketMatchState;
  participants: BracketParticipant[];
}

export interface BracketResponseDto {
  tournamentId: string;
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  totalRounds: number;
  totalMatches: number;
  // Single elimination uses 'matches'
  matches?: BracketMatch[];
  // Double elimination uses 'upper' and 'lower'
  upper?: BracketMatch[];
  lower?: BracketMatch[];
}

export interface GenerateBracketDto {
  includeThirdPlaceMatch?: boolean; // Default from tournament config
}

// ============================================
// Request Context
// ============================================

export interface RequestContext {
  user: {
    id: string;
    role: string; // Can be AdminRole ('ADMIN' | 'MODERATOR') or UserRole
  };
}
