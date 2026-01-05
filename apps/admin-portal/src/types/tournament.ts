/**
 * Tournament Types for Admin Portal
 */

export type TournamentGameType = 'SINGLE_STAGE' | 'TWO_STAGES';

export type TournamentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';

export interface MatchFormat {
  bestOf: 3 | 5 | 7;
  pointsToWin: 11 | 21;
  deuceRule: boolean;
  minLeadToWin: 2;
}

export interface SingleEliminationConfig {
  hasPlacementMatches: boolean;
}

export interface RoundRobinConfig {
  matchupsPerPair: number;
  rankBy: 'MATCH_WINS' | 'POINTS';
  placementMethod: 'PARTICIPANT_LIST_ORDER' | 'RANDOM' | 'SEEDED';
  tieBreaks: Array<'WINS_VS_TIED' | 'GAME_SET_DIFFERENCE' | 'POINTS_DIFFERENCE'>;
}

export interface SingleStageConfig {
  format: TournamentFormat;
  matchFormat: MatchFormat;
  singleEliminationConfig?: SingleEliminationConfig;
  roundRobinConfig?: RoundRobinConfig;
}

export interface GroupStageConfig {
  format: 'ROUND_ROBIN';
  matchFormat: MatchFormat;
  participantsPerGroup: number;
  participantsAdvancing: number;
  matchupsPerPair: number;
  rankBy: 'MATCH_WINS' | 'POINTS';
  placementMethod: 'PARTICIPANT_LIST_ORDER' | 'RANDOM' | 'SEEDED';
  tieBreaks: Array<'WINS_VS_TIED' | 'GAME_SET_DIFFERENCE' | 'POINTS_DIFFERENCE'>;
}

export interface FinalStageConfig {
  format: 'SINGLE_ELIMINATION';
  matchFormat: MatchFormat;
  hasPlacementMatches: boolean;
}

export interface TwoStagesConfig {
  groupStage: GroupStageConfig;
  finalStage: FinalStageConfig;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  game: string;
  gameType: TournamentGameType;
  status: TournamentStatus;
  registrationStartTime?: Date | string;
  isTentative: boolean;
  singleStageConfig?: SingleStageConfig;
  twoStagesConfig?: TwoStagesConfig;
  participantsLocked: boolean;
  challongeId?: string;
  challongeUrl?: string;
  lastSyncedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  participantsCount?: number;
  matchesCount?: number;
}

export interface TournamentFormData {
  name: string;
  description?: string;
  game?: string;
  gameType: TournamentGameType;
  registrationStartTime?: string;
  isTentative?: boolean;
  singleStageConfig?: SingleStageConfig;
  twoStagesConfig?: TwoStagesConfig;
}
