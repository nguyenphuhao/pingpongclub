'use client';

import { useMemo } from 'react';
import { SingleEliminationBracket, SVGViewer } from '@g-loot/react-tournament-brackets';
import type { TournamentMatch } from '@/types/match';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BracketViewProps {
  matches: TournamentMatch[];
  loading?: boolean;
  error?: string | null;
}

type BracketParticipant = {
  id: string;
  name: string;
  resultText?: string | null;
  isWinner?: boolean;
  status?: string | null;
};

type BracketMatch = {
  id: string;
  nextMatchId?: string | null;
  tournamentRoundText?: string;
  startTime?: string | null;
  state?: string;
  matchNumber?: number;
  matchDate?: string | null;
  courtNumber?: string | null;
  participants: BracketParticipant[];
};

type BracketMatchCardProps = {
  match: BracketMatch;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

const getMatchState = (status: TournamentMatch['status']) => {
  if (status === 'COMPLETED') return 'DONE';
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return 'SCHEDULED';
};

const buildBracketMatches = (matches: TournamentMatch[]): BracketMatch[] => {
  const matchIdByRound = new Map<string, string>();

  matches.forEach((match) => {
    matchIdByRound.set(`${match.round}-${match.matchNumber}`, match.id);
  });

  return matches
    .slice()
    .sort((a, b) => (a.round !== b.round ? a.round - b.round : a.matchNumber - b.matchNumber))
    .map((match) => {
      const nextMatchId =
        matchIdByRound.get(`${match.round + 1}-${Math.ceil(match.matchNumber / 2)}`) || null;
      const scoreParts = match.finalScore?.split('-') || [];
      const participantsByPosition = new Map<number, TournamentMatch['participants'][number]>();

      match.participants.forEach((participant) => {
        participantsByPosition.set(participant.position, participant);
      });

      const buildParticipant = (position: 1 | 2, scoreIndex: number): BracketParticipant => {
        const participant = participantsByPosition.get(position);
        const participantName =
          participant?.participant?.user?.displayName ||
          participant?.participant?.user?.nickname ||
          participant?.participant?.displayName ||
          'TBD';

        return {
          id: participant?.participantId || `${match.id}-tbd-${position}`,
          name: participantName,
          resultText: scoreParts[scoreIndex] || null,
          isWinner: participant?.participantId ? match.winnerId === participant.participantId : false,
          status: match.status,
        };
      };

      return {
        id: match.id,
        nextMatchId,
        tournamentRoundText: `Vòng ${match.round}`,
        startTime: match.matchDate ? new Date(match.matchDate).toISOString() : null,
        state: getMatchState(match.status),
        matchNumber: match.matchNumber,
        matchDate: match.matchDate,
        courtNumber: match.courtNumber,
        participants: [buildParticipant(1, 0), buildParticipant(2, 1)],
      };
    });
};

const BracketMatchCard = ({ match, className, style, ...props }: BracketMatchCardProps) => {
  const [home, away] = match.participants;
  const homeScore = home?.resultText ?? '-';
  const awayScore = away?.resultText ?? '-';
  const matchTime = match.matchDate
    ? new Date(match.matchDate).toLocaleString()
    : 'Chưa lên lịch';
  const courtLabel = match.courtNumber ? `Sân ${match.courtNumber}` : 'Chưa có sân';

  return (
    <div
      className={`w-60 rounded-md border border-border bg-card text-foreground shadow-sm ${className || ''}`}
      style={style}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-semibold">Trận {match.matchNumber ?? '--'}</span>
        <span>{matchTime}</span>
        <span>{courtLabel}</span>
      </div>
      <div className="space-y-1 px-3 py-2 text-sm">
        <div className={`flex items-center justify-between rounded-md px-2 py-1 ${home?.isWinner ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-foreground'}`}>
          <span className="truncate">{home?.name || 'TBD'}</span>
          <span className="ml-2 text-xs font-semibold">{homeScore}</span>
        </div>
        <div className={`flex items-center justify-between rounded-md px-2 py-1 ${away?.isWinner ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-foreground'}`}>
          <span className="truncate">{away?.name || 'TBD'}</span>
          <span className="ml-2 text-xs font-semibold">{awayScore}</span>
        </div>
      </div>
    </div>
  );
};

export function BracketView({ matches, loading, error }: BracketViewProps) {
  const totalFinalRounds = useMemo(() => {
    return matches.reduce((max, match) => Math.max(max, match.round), 0);
  }, [matches]);

  const getFinalRoundLabel = (round: number) => {
    if (!totalFinalRounds) {
      return `Vòng ${round}`;
    }

    const roundsLeft = totalFinalRounds - round;
    if (roundsLeft === 0) return 'Chung kết';
    if (roundsLeft === 1) return 'Bán kết';
    if (roundsLeft === 2) return 'Tứ kết';
    if (roundsLeft === 3) return 'Vòng 1/8';
    if (roundsLeft === 4) return 'Vòng 1/16';

    const bracketSize = Math.pow(2, roundsLeft + 1);
    return `Vòng 1/${bracketSize}`;
  };

  const bracketMatches = useMemo(() => {
    return buildBracketMatches(matches).map((match) => {
      const label = match.tournamentRoundText?.replace(
        /Vòng (\d+)/,
        (_, roundText) => getFinalRoundLabel(Number(roundText)),
      );

      return {
        ...match,
        tournamentRoundText: label,
        participants: match.participants.map((participant) => ({
          ...participant,
          name: participant.name.replace(/\(Vòng (\d+)\)/, (_, roundText) => {
            return `(${getFinalRoundLabel(Number(roundText))})`;
          }),
        })),
      };
    });
  }, [matches, getFinalRoundLabel]);

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải sơ đồ...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (bracketMatches.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Chưa có trận đấu vòng cuối để hiển thị
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/10">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Sơ đồ nhánh</h3>
        <span className="text-xs text-muted-foreground">Kéo để xem</span>
      </div>
      <div className="h-[560px] w-full overflow-hidden bg-background">
        <SingleEliminationBracket
          matches={bracketMatches}
          matchComponent={BracketMatchCard}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer width={1100} height={560} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      </div>
    </div>
  );
}
