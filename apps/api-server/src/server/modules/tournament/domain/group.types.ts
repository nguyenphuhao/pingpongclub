/**
 * Group Domain Types
 * Types and DTOs for tournament group management
 */

import { GroupStatus, ParticipantStatus, MatchStatus } from '@prisma/client';
import { TieBreak } from './tournament.types';

// ============================================
// Group DTOs
// ============================================

export interface CreateGroupDto {
  name: string;
  displayName?: string;
  participantsPerGroup?: number; // 2-20, default from tournament config
  participantsAdvancing?: number; // default from tournament config
}

export interface UpdateGroupDto {
  name?: string;
  displayName?: string;
  participantsPerGroup?: number;
  participantsAdvancing?: number;
}

export interface GroupQueryDto {
  status?: GroupStatus;
  page?: number;
  limit?: number;
}

export interface GroupResponseDto {
  id: string;
  tournamentId: string;
  name: string;
  displayName: string;
  participantsPerGroup: number;
  participantsAdvancing: number;
  status: GroupStatus;
  participantCount: number;
  matchCount: number;
  // Optional detailed data
  participants?: ParticipantResponseDto[];
  matches?: MatchResponseDto[];
}

export interface PaginatedGroupsDto {
  data: GroupResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AutoGenerateGroupsDto {
  numberOfGroups?: number; // Target number of groups (e.g., 4 groups)
  participantsPerGroup?: number; // Target participants per group (e.g., 4 people/group)
  participantsAdvancing?: number; // How many advance from each group, default from tournament config
  groupNamePrefix?: string; // Prefix for group names (e.g., "Group" -> "Group A", "Group B"), default "Group"
}

export interface AutoGenerateGroupsResponseDto {
  groupsCreated: number;
  participantsAssigned: number;
  groups: Array<{
    id: string;
    name: string;
    displayName: string;
    participantCount: number;
    participantIds: string[];
    seeds: number[];
  }>;
}

// ============================================
// Participant Assignment DTOs
// ============================================

export interface AddParticipantToGroupDto {
  participantId: string;
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
// Match Generation DTOs
// ============================================

export interface GenerateMatchesDto {
  matchupsPerPair?: number; // How many times each pair plays, default 1
}

export interface GenerateMatchesResponseDto {
  groupId: string;
  matchesGenerated: number;
  rounds: number;
  matches: MatchResponseDto[];
}

export interface MatchResponseDto {
  id: string;
  tournamentId: string;
  groupId: string | null;
  stage: 'GROUP' | 'FINAL';
  round: number;
  matchNumber: number;
  status: MatchStatus;
  matchDate?: Date;
  courtNumber?: string;
  winnerId?: string;
  finalScore?: string;
  gameScores?: GameScore[];
  participants: MatchParticipantDto[];
}

export interface MatchParticipantDto {
  id: string;
  participantId: string;
  position: number;
  isWinner?: boolean;
  score?: string;
  participant?: ParticipantResponseDto;
}

export interface GameScore {
  game: number;
  player1Score: number;
  player2Score: number;
  duration?: number;
}

// ============================================
// Standings DTOs
// ============================================

export interface StandingsResponseDto {
  groupId: string;
  groupName: string;
  tieBreakRules: TieBreak[];
  standings: StandingEntryDto[];
}

export interface StandingEntryDto {
  rank: number;
  participant: ParticipantResponseDto;
  matchRecord: {
    wins: number;
    losses: number;
    draws?: number;
  };
  gameRecord: {
    wins: number;
    losses: number;
    difference: number;
  };
  pointsRecord: {
    for: number;
    against: number;
    difference: number;
  };
  tieBreakInfo?: {
    appliedRule: TieBreak;
    description: string;
  };
  isAdvancing: boolean;
}

// ============================================
// Internal Types for Tie Break Service
// ============================================

export interface StandingPlayer {
  id: string; // participantId
  userId: string;
  user?: any;
  matchRecord: {
    wins: number;
    losses: number;
    draws?: number;
  };
  gameRecord?: {
    wins: number;
    losses: number;
    difference: number;
  };
  pointsRecord?: {
    for: number;
    against: number;
    difference: number;
  };
  tieBreakInfo?: {
    appliedRule: TieBreak;
    description: string;
  };
}

export interface MatchData {
  id: string;
  winnerId: string | null;
  gameScores: GameScore[];
  participants: {
    participantId: string;
    position: number;
    isWinner: boolean | null;
  }[];
}

// ============================================
// Round Robin Pairing
// ============================================

export interface Pairing {
  participant1Id: string;
  participant2Id: string;
  round: number;
  matchNumber: number;
}
