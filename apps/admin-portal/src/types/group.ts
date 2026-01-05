/**
 * Tournament Group Types for Admin Portal
 */

export type GroupStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Group {
  id: string;
  tournamentId: string;
  name: string;
  displayName: string;
  participantsPerGroup: number;
  participantsAdvancing: number;
  status: GroupStatus;
  participantCount: number;
  matchCount: number;
}

export interface PaginatedGroups {
  data: Group[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type TieBreak = 'WINS_VS_TIED' | 'GAME_SET_DIFFERENCE' | 'POINTS_DIFFERENCE';

export interface StandingEntry {
  rank: number;
  participant: {
    id: string;
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
  };
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

export interface GroupStandings {
  groupId: string;
  groupName: string;
  tieBreakRules: TieBreak[];
  standings: StandingEntry[];
}

import type { TournamentMatch } from './match';
