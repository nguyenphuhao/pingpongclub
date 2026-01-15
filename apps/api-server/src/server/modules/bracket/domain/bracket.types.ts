import { BracketSourceType, MatchSideLabel } from '@pingclub/database';

export type SeedOrder = 'STANDARD' | 'REVERSE';

export type BracketSlotView = {
  id: string;
  targetMatchId: string;
  targetSide: MatchSideLabel;
  sourceType: BracketSourceType;
  sourceMatchId?: string | null;
  sourceGroupId?: string | null;
  sourceRank?: number | null;
  sourceSeed?: number | null;
  resolved: boolean;
  participant?: {
    id: string;
    displayName: string;
  } | null;
};

export type BracketMatchView = {
  id: string;
  roundNo: number | null;
  matchNo: number | null;
  status: string;
  sides: Array<{
    side: MatchSideLabel;
    participants: Array<{
      id: string;
      displayName: string;
    }>;
  }>;
};

export type BracketView = {
  matches: BracketMatchView[];
  slots: BracketSlotView[];
};
