/**
 * Tie Break Service
 * Handles tie break logic for group standings
 */

import { TieBreak, StandingPlayer, MatchData, GameScore } from '../domain/tournament.types';

export class TieBreakService {
  /**
   * Calculate complete standings with all statistics and tie breaks applied
   */
  calculateStandings(
    participants: any[],
    matches: any[],
    tieBreakRules: TieBreak[],
  ): StandingPlayer[] {
    // 1. Transform matches to MatchData format
    const matchData: MatchData[] = matches.map((m) => ({
      id: m.id,
      winnerId: m.winnerId,
      gameScores: (m.gameScores as GameScore[]) || [],
      participants: m.participants.map((p: any) => ({
        participantId: p.participantId,
        position: p.position,
        isWinner: p.isWinner,
      })),
    }));

    // 2. Calculate records for each participant
    const standings: StandingPlayer[] = participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      user: p.user,
      matchRecord: this.calculateMatchRecord(p.id, matchData),
      gameRecord: this.calculateGameRecord(p.id, matchData),
      pointsRecord: this.calculatePointsRecord(p.id, matchData),
    }));

    // 3. Apply tie breaks to sort standings
    const sorted = this.applyTieBreaks(standings, matchData, tieBreakRules);

    return sorted;
  }

  /**
   * Apply tie break rules to determine standings
   */
  applyTieBreaks(
    players: StandingPlayer[],
    matches: MatchData[],
    tieBreakRules: TieBreak[],
  ): StandingPlayer[] {
    // Group players by match record (wins-losses)
    const groups = this.groupByMatchRecord(players);
    const result: StandingPlayer[] = [];

    for (const group of groups) {
      if (group.length === 1) {
        // No tie, add directly
        result.push(group[0]);
      } else {
        // Tie exists, resolve using rules
        let sorted = this.resolveTie([...group], matches, tieBreakRules);
        result.push(...sorted);
      }
    }

    return result;
  }

  /**
   * Resolve tie among players with same match record
   */
  private resolveTie(
    tiedPlayers: StandingPlayer[],
    matches: MatchData[],
    tieBreakRules: TieBreak[],
  ): StandingPlayer[] {
    let sorted = [...tiedPlayers];

    for (const rule of tieBreakRules) {
      sorted = this.applyRule(sorted, matches, rule);

      // Check if tie is resolved
      if (this.isTieResolved(sorted, matches, rule)) {
        // Add tie break info
        sorted = this.addTieBreakInfo(sorted, rule);
        break;
      }
    }

    // If still tied after all rules, keep current order (by seed/registration)
    return sorted;
  }

  /**
   * Apply a specific tie break rule
   */
  private applyRule(
    players: StandingPlayer[],
    matches: MatchData[],
    rule: TieBreak,
  ): StandingPlayer[] {
    switch (rule) {
      case 'WINS_VS_TIED':
        return this.winsVsTied(players, matches);

      case 'GAME_SET_DIFFERENCE':
        return this.gameSetDifference(players, matches);

      case 'POINTS_DIFFERENCE':
        return this.pointsDifference(players, matches);

      default:
        return players;
    }
  }

  // ============================================
  // Tie Break Rules
  // ============================================

  /**
   * Rule 1: WINS_VS_TIED - Head-to-head wins among tied players
   */
  private winsVsTied(tiedPlayers: StandingPlayer[], matches: MatchData[]): StandingPlayer[] {
    const tiedPlayerIds = new Set(tiedPlayers.map((p) => p.id));

    // Get matches only between tied players (head-to-head)
    const h2hMatches = matches.filter((m) =>
      m.participants.every((p) => tiedPlayerIds.has(p.participantId)),
    );

    // Count H2H wins
    const h2hWins: Record<string, number> = {};
    for (const match of h2hMatches) {
      if (match.winnerId && tiedPlayerIds.has(match.winnerId)) {
        h2hWins[match.winnerId] = (h2hWins[match.winnerId] || 0) + 1;
      }
    }

    // Sort by H2H wins (descending)
    return tiedPlayers.sort((a, b) => (h2hWins[b.id] || 0) - (h2hWins[a.id] || 0));
  }

  /**
   * Rule 2: GAME_SET_DIFFERENCE - Difference in games won/lost
   */
  private gameSetDifference(tiedPlayers: StandingPlayer[], matches: MatchData[]): StandingPlayer[] {
    const gameDiff: Record<string, number> = {};

    for (const player of tiedPlayers) {
      const playerMatches = matches.filter((m) =>
        m.participants.some((p) => p.participantId === player.id),
      );

      let gamesWon = 0;
      let gamesLost = 0;

      for (const match of playerMatches) {
        const participant = match.participants.find((p) => p.participantId === player.id)!;
        const gameScores = match.gameScores || [];

        for (const game of gameScores) {
          if (participant.position === 1) {
            if (game.player1Score > game.player2Score) {
              gamesWon++;
            } else {
              gamesLost++;
            }
          } else {
            if (game.player2Score > game.player1Score) {
              gamesWon++;
            } else {
              gamesLost++;
            }
          }
        }
      }

      gameDiff[player.id] = gamesWon - gamesLost;
    }

    // Sort by game difference (descending)
    return tiedPlayers.sort((a, b) => gameDiff[b.id] - gameDiff[a.id]);
  }

  /**
   * Rule 3: POINTS_DIFFERENCE - Difference in points scored/conceded
   */
  private pointsDifference(tiedPlayers: StandingPlayer[], matches: MatchData[]): StandingPlayer[] {
    const pointsDiff: Record<string, number> = {};

    for (const player of tiedPlayers) {
      const playerMatches = matches.filter((m) =>
        m.participants.some((p) => p.participantId === player.id),
      );

      let pointsFor = 0;
      let pointsAgainst = 0;

      for (const match of playerMatches) {
        const participant = match.participants.find((p) => p.participantId === player.id)!;
        const gameScores = match.gameScores || [];

        for (const game of gameScores) {
          if (participant.position === 1) {
            pointsFor += game.player1Score;
            pointsAgainst += game.player2Score;
          } else {
            pointsFor += game.player2Score;
            pointsAgainst += game.player1Score;
          }
        }
      }

      pointsDiff[player.id] = pointsFor - pointsAgainst;
    }

    // Sort by points difference (descending)
    return tiedPlayers.sort((a, b) => pointsDiff[b.id] - pointsDiff[a.id]);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Calculate match record (wins/losses) for a participant
   */
  private calculateMatchRecord(
    participantId: string,
    matches: MatchData[],
  ): { wins: number; losses: number; draws: number } {
    const playerMatches = matches.filter((m) =>
      m.participants.some((p) => p.participantId === participantId),
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const match of playerMatches) {
      if (match.winnerId === participantId) {
        wins++;
      } else if (match.winnerId === null) {
        draws++;
      } else {
        losses++;
      }
    }

    return { wins, losses, draws };
  }

  /**
   * Calculate game record (games won/lost) for a participant
   */
  private calculateGameRecord(
    participantId: string,
    matches: MatchData[],
  ): { wins: number; losses: number; difference: number } {
    const playerMatches = matches.filter((m) =>
      m.participants.some((p) => p.participantId === participantId),
    );

    let gamesWon = 0;
    let gamesLost = 0;

    for (const match of playerMatches) {
      const participant = match.participants.find((p) => p.participantId === participantId)!;
      const gameScores = match.gameScores || [];

      for (const game of gameScores) {
        if (participant.position === 1) {
          if (game.player1Score > game.player2Score) {
            gamesWon++;
          } else {
            gamesLost++;
          }
        } else {
          if (game.player2Score > game.player1Score) {
            gamesWon++;
          } else {
            gamesLost++;
          }
        }
      }
    }

    return {
      wins: gamesWon,
      losses: gamesLost,
      difference: gamesWon - gamesLost,
    };
  }

  /**
   * Calculate points record (points for/against) for a participant
   */
  private calculatePointsRecord(
    participantId: string,
    matches: MatchData[],
  ): { for: number; against: number; difference: number } {
    const playerMatches = matches.filter((m) =>
      m.participants.some((p) => p.participantId === participantId),
    );

    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const match of playerMatches) {
      const participant = match.participants.find((p) => p.participantId === participantId)!;
      const gameScores = match.gameScores || [];

      for (const game of gameScores) {
        if (participant.position === 1) {
          pointsFor += game.player1Score;
          pointsAgainst += game.player2Score;
        } else {
          pointsFor += game.player2Score;
          pointsAgainst += game.player1Score;
        }
      }
    }

    return {
      for: pointsFor,
      against: pointsAgainst,
      difference: pointsFor - pointsAgainst,
    };
  }

  /**
   * Group players by their match record
   */
  private groupByMatchRecord(players: StandingPlayer[]): StandingPlayer[][] {
    const groups = new Map<string, StandingPlayer[]>();

    for (const player of players) {
      const key = `${player.matchRecord.wins}-${player.matchRecord.losses}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(player);
    }

    // Sort groups by wins (descending)
    return Array.from(groups.values()).sort(
      (a, b) => b[0].matchRecord.wins - a[0].matchRecord.wins,
    );
  }

  /**
   * Check if tie is resolved (all players have different values for the applied rule)
   */
  private isTieResolved(
    players: StandingPlayer[],
    matches: MatchData[],
    lastRule: TieBreak,
  ): boolean {
    const values = players.map((p) => this.calculateValue(p, matches, lastRule));
    const uniqueValues = new Set(values);
    return uniqueValues.size === values.length;
  }

  /**
   * Calculate value for a player based on a specific rule
   */
  private calculateValue(player: StandingPlayer, matches: MatchData[], rule: TieBreak): number {
    switch (rule) {
      case 'WINS_VS_TIED':
        // For simplicity, return overall wins (actual H2H would need context)
        return player.matchRecord.wins;

      case 'GAME_SET_DIFFERENCE':
        return player.gameRecord?.difference || 0;

      case 'POINTS_DIFFERENCE':
        return player.pointsRecord?.difference || 0;

      default:
        return 0;
    }
  }

  /**
   * Add tie break info to players showing which rule resolved the tie
   */
  private addTieBreakInfo(players: StandingPlayer[], rule: TieBreak): StandingPlayer[] {
    return players.map((player, index) => {
      if (index === 0) {
        // Winner of the tie break
        return {
          ...player,
          tieBreakInfo: {
            appliedRule: rule,
            description: this.getTieBreakDescription(rule, player, true),
          },
        };
      } else {
        return {
          ...player,
          tieBreakInfo: {
            appliedRule: rule,
            description: this.getTieBreakDescription(rule, player, false),
          },
        };
      }
    });
  }

  /**
   * Get human-readable description of tie break result
   */
  private getTieBreakDescription(
    rule: TieBreak,
    player: StandingPlayer,
    isWinner: boolean,
  ): string {
    switch (rule) {
      case 'WINS_VS_TIED':
        return isWinner ? 'Won head-to-head matches' : 'Lost head-to-head matches';

      case 'GAME_SET_DIFFERENCE':
        const gameDiff = player.gameRecord?.difference || 0;
        return `Game difference: ${gameDiff > 0 ? '+' : ''}${gameDiff}`;

      case 'POINTS_DIFFERENCE':
        const pointsDiff = player.pointsRecord?.difference || 0;
        return `Points difference: ${pointsDiff > 0 ? '+' : ''}${pointsDiff}`;

      default:
        return 'Tie break applied';
    }
  }
}
