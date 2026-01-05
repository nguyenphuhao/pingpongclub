/**
 * Bracket Service
 * Handles bracket generation and retrieval for tournament visualization
 * Compatible with @g-loot/react-tournament-brackets
 */

import { PrismaClient, TournamentStatus, MatchStatus, ParticipantStatus } from '@prisma/client';
import {
  BracketResponseDto,
  BracketMatch,
  BracketParticipant,
  BracketMatchState,
  GenerateBracketDto,
  RequestContext,
  SingleStageConfig,
  TwoStagesConfig,
} from '../domain/tournament.types';
import { VirtualParticipantHelper } from './helpers/virtual-participant.helper';

export class BracketService {
  private prisma: PrismaClient;
  private virtualParticipantHelper: VirtualParticipantHelper;

  constructor() {
    this.prisma = new PrismaClient();
    this.virtualParticipantHelper = new VirtualParticipantHelper(this.prisma);
  }

  /**
   * Generate bracket matches for SINGLE_ELIMINATION tournament
   * Creates all matches from first round to final
   */
  async generateBracket(
    tournamentId: string,
    dto: GenerateBracketDto,
    ctx: RequestContext,
  ): Promise<BracketResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể tạo bảng đấu loại trực tiếp');
    }

    // 2. Validate tournament exists and get config
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          where: {
            status: {
              in: [ParticipantStatus.REGISTERED, ParticipantStatus.CHECKED_IN]
            }
          },
          orderBy: { seed: 'asc' },
          include: { user: true },
        },
      },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Tournament not found');
    }

    // 3. Validate tournament status
    if (
      tournament.status !== TournamentStatus.DRAFT &&
      tournament.status !== TournamentStatus.PENDING
    ) {
      throw new Error('Không thể tạo bảng đấu cho giải đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 4. Validate participants are locked
    if (!tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia phải được khóa trước khi tạo bảng đấu');
    }

    // 5. Determine tournament format and participants
    let format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' = 'SINGLE_ELIMINATION';
    let hasThirdPlaceMatch = false;
    let participants = tournament.participants;

    if (tournament.gameType === 'SINGLE_STAGE') {
      const config = tournament.singleStageConfig as unknown as SingleStageConfig;
      if (config.format !== 'SINGLE_ELIMINATION') {
        throw new Error('Tạo bảng đấu chỉ hỗ trợ định dạng loại trực tiếp (SINGLE_ELIMINATION)');
      }
      hasThirdPlaceMatch = dto.includeThirdPlaceMatch ?? config.singleEliminationConfig?.hasPlacementMatches ?? false;
    } else if (tournament.gameType === 'TWO_STAGES') {
      const config = tournament.twoStagesConfig as unknown as TwoStagesConfig;
      hasThirdPlaceMatch = dto.includeThirdPlaceMatch ?? config.finalStage?.hasPlacementMatches ?? false;

      // Check if groups exist
      const groups = await this.prisma.tournamentGroup.findMany({
        where: { tournamentId },
      });

      if (groups.length === 0) {
        throw new Error('Chưa có bảng đấu nào được tạo');
      }

      // Create virtual participants for all advancing spots
      const virtualParticipants = await this.virtualParticipantHelper.createVirtualParticipantsForTwoStages(
        tournamentId,
      );

      // Convert to participant format expected by bracket generation
      participants = virtualParticipants.map((vp) => ({
        id: vp.id,
        userId: null,
        isVirtual: true,
        displayName: vp.displayName,
        groupId: vp.groupId,
        seed: vp.rank, // Use rank as seed for proper ordering
      })) as any;
    }

    const participantCount = participants.length;

    if (participantCount < 2) {
      throw new Error('Cần ít nhất 2 người tham gia để tạo bảng đấu');
    }

    // 6. Check if bracket already exists
    const existingMatches = await this.prisma.tournamentMatch.findMany({
      where: { tournamentId, stage: 'FINAL' },
    });

    if (existingMatches.length > 0) {
      throw new Error('Bảng đấu đã được tạo. Xóa các trận đấu hiện có trước.');
    }

    // 7. Calculate bracket structure
    const totalRounds = Math.ceil(Math.log2(participantCount));
    const totalSlotsInFirstRound = Math.pow(2, totalRounds);
    const byeCount = totalSlotsInFirstRound - participantCount;

    // 8. Generate matches in transaction
    const matches = await this.prisma.$transaction(async (tx) => {
      const createdMatches: any[] = [];

      // Track match IDs and details by round for linking
      const matchIdsByRound: Record<number, string[]> = {};
      const matchDetailsByRound: Record<number, Array<{ id: string; matchNumber: number; round: number }>> = {};

      // Generate matches for each round (from round 1 to final)
      for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = Math.pow(2, totalRounds - round);
        matchIdsByRound[round] = [];
        matchDetailsByRound[round] = [];

        for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
          // Use UUID to avoid conflicts (Prisma will auto-generate)
          const match = await tx.tournamentMatch.create({
            data: {
              tournamentId,
              stage: 'FINAL',
              round,
              matchNumber: matchNum,
              status: MatchStatus.SCHEDULED,
            },
          });

          matchIdsByRound[round].push(match.id);
          matchDetailsByRound[round].push({
            id: match.id,
            matchNumber: matchNum,
            round,
          });
          createdMatches.push(match);
        }
      }

      // 9. Assign participants to ALL rounds
      // Round 1: Assign real participants using proper bracket seeding
      const firstRoundMatches = matchDetailsByRound[1];

      // Standard bracket seeding order for round 1 matches
      // For 16 slots: [1v16, 8v9, 4v13, 5v12, 2v15, 7v10, 3v14, 6v11]
      const seedPairings: Array<[number, number]> = [];
      for (let i = 0; i < totalSlotsInFirstRound / 2; i++) {
        let high, low;
        if (i % 2 === 0) {
          // Top half: 1, 4, 2, 3
          high = i / 2 + 1;
        } else {
          // Bottom half: 8, 5, 7, 6
          high = totalSlotsInFirstRound / 2 - Math.floor(i / 2);
        }
        low = totalSlotsInFirstRound + 1 - high;
        seedPairings.push([high, low]);
      }

      // Assign participants to matches based on seed pairings
      for (let i = 0; i < firstRoundMatches.length; i++) {
        const match = firstRoundMatches[i];
        const [highSeed, lowSeed] = seedPairings[i];
        const matchParticipants: Array<{ participantId: string; position: number }> = [];

        // Check if high seed participant exists (1-indexed to 0-indexed)
        const highSeedIndex = highSeed - 1;
        if (highSeedIndex < participantCount) {
          matchParticipants.push({
            participantId: participants[highSeedIndex].id,
            position: 1,
          });
        }

        // Check if low seed participant exists
        const lowSeedIndex = lowSeed - 1;
        if (lowSeedIndex < participantCount) {
          matchParticipants.push({
            participantId: participants[lowSeedIndex].id,
            position: 2,
          });
        }

        // Create match participants (can be 0, 1, or 2 participants)
        if (matchParticipants.length > 0) {
          await tx.tournamentMatchParticipant.createMany({
            data: matchParticipants.map((p) => ({
              matchId: match.id,
              participantId: p.participantId,
              position: p.position,
            })),
          });
        }
      }

      // Rounds 2+: Create virtual participants for match winners
      for (let round = 2; round <= totalRounds; round++) {
        const currentRoundMatches = matchDetailsByRound[round];
        const previousRoundMatches = matchDetailsByRound[round - 1];

        for (let i = 0; i < currentRoundMatches.length; i++) {
          const match = currentRoundMatches[i];

          // Each match in this round gets winners from 2 previous matches
          const prevMatch1 = previousRoundMatches[i * 2];
          const prevMatch2 = previousRoundMatches[i * 2 + 1];

          if (prevMatch1) {
            // Create virtual participant for winner of previous match 1
            const virtualParticipant1 = await tx.tournamentParticipant.create({
              data: {
                tournamentId,
                // No userId for virtual participant
                isVirtual: true,
                displayName: `Thắng trận ${prevMatch1.matchNumber} (Vòng ${prevMatch1.round})`,
                advancingSource: JSON.stringify({
                  type: 'match',
                  matchId: prevMatch1.id,
                  position: 'winner',
                }),
                status: 'REGISTERED',
              },
            });

            await tx.tournamentMatchParticipant.create({
              data: {
                matchId: match.id,
                participantId: virtualParticipant1.id,
                position: 1,
              },
            });
          }

          if (prevMatch2) {
            // Create virtual participant for winner of previous match 2
            const virtualParticipant2 = await tx.tournamentParticipant.create({
              data: {
                tournamentId,
                // No userId for virtual participant
                isVirtual: true,
                displayName: `Thắng trận ${prevMatch2.matchNumber} (Vòng ${prevMatch2.round})`,
                advancingSource: JSON.stringify({
                  type: 'match',
                  matchId: prevMatch2.id,
                  position: 'winner',
                }),
                status: 'REGISTERED',
              },
            });

            await tx.tournamentMatchParticipant.create({
              data: {
                matchId: match.id,
                participantId: virtualParticipant2.id,
                position: 2,
              },
            });
          }
        }
      }

      // 10. Create third place match if needed
      if (hasThirdPlaceMatch && totalRounds >= 2) {
        const semiFinalMatches = matchDetailsByRound[totalRounds - 1];

        const thirdPlaceMatch = await tx.tournamentMatch.create({
          data: {
            tournamentId,
            stage: 'FINAL',
            round: totalRounds,
            matchNumber: 99, // Special number for 3rd place
            status: MatchStatus.SCHEDULED,
          },
        });

        // Add virtual participants for losers of semifinals
        if (semiFinalMatches && semiFinalMatches.length >= 2) {
          const semi1 = semiFinalMatches[0];
          const semi2 = semiFinalMatches[1];

          // Loser of semi 1
          const virtualParticipant1 = await tx.tournamentParticipant.create({
            data: {
              tournamentId,
              // No userId for virtual participant
              isVirtual: true,
              displayName: `Thua trận ${semi1.matchNumber} (Vòng ${semi1.round})`,
              advancingSource: JSON.stringify({
                type: 'match',
                matchId: semi1.id,
                position: 'loser',
              }),
              status: 'REGISTERED',
            },
          });

          await tx.tournamentMatchParticipant.create({
            data: {
              matchId: thirdPlaceMatch.id,
              participantId: virtualParticipant1.id,
              position: 1,
            },
          });

          // Loser of semi 2
          const virtualParticipant2 = await tx.tournamentParticipant.create({
            data: {
              tournamentId,
              // No userId for virtual participant
              isVirtual: true,
              displayName: `Thua trận ${semi2.matchNumber} (Vòng ${semi2.round})`,
              advancingSource: JSON.stringify({
                type: 'match',
                matchId: semi2.id,
                position: 'loser',
              }),
              status: 'REGISTERED',
            },
          });

          await tx.tournamentMatchParticipant.create({
            data: {
              matchId: thirdPlaceMatch.id,
              participantId: virtualParticipant2.id,
              position: 2,
            },
          });
        }

        createdMatches.push(thirdPlaceMatch);
      }

      return createdMatches;
    });

    // 11. Return bracket structure
    return this.getBracket(tournamentId, ctx);
  }

  /**
   * Get bracket structure for visualization
   * Returns format compatible with @g-loot/react-tournament-brackets
   */
  async getBracket(
    tournamentId: string,
    ctx: RequestContext,
  ): Promise<BracketResponseDto> {
    // 1. Fetch tournament
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Tournament not found');
    }

    // 2. Fetch all bracket matches
    const matches = await this.prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        stage: 'FINAL',
      },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    if (matches.length === 0) {
      throw new Error('Bảng đấu chưa được tạo. Gọi /bracket/generate trước.');
    }

    // 3. Build match ID lookup for next match calculation
    const matchesByRoundAndNum: Record<string, string> = {};
    matches.forEach((m) => {
      const key = `${m.round}-${m.matchNumber}`;
      matchesByRoundAndNum[key] = m.id;
    });

    // 4. Map to bracket format
    const bracketMatches: BracketMatch[] = matches.map((match) => {
      // Calculate next match ID
      let nextMatchId: string | null = null;
      if (match.matchNumber !== 99) { // Not 3rd place match
        const nextRound = match.round + 1;
        const nextMatchNumber = Math.ceil(match.matchNumber / 2);
        const nextKey = `${nextRound}-${nextMatchNumber}`;
        nextMatchId = matchesByRoundAndNum[nextKey] || null;
      }

      // Map participants
      const participants: BracketParticipant[] = [];

      if (match.participants.length === 0) {
        // TBD participants
        participants.push({
          id: `TBD-${match.id}-1`,
          resultText: null,
          isWinner: false,
          status: null,
          name: 'TBD',
        });
        participants.push({
          id: `TBD-${match.id}-2`,
          resultText: null,
          isWinner: false,
          status: null,
          name: 'TBD',
        });
      } else {
        match.participants.forEach((mp) => {
          // Handle both real and virtual participants
          let participantName = 'TBD';
          if (mp.participant.isVirtual) {
            // Virtual participant - use displayName
            participantName = mp.participant.displayName || 'TBD';
          } else if (mp.participant.user) {
            // Real participant - use user's display name
            participantName = mp.participant.user.displayName || mp.participant.user.email;
          }

          participants.push({
            id: mp.participantId,
            resultText: mp.score || null,
            isWinner: mp.isWinner || false,
            status: match.status === MatchStatus.COMPLETED ? 'PLAYED' : null,
            name: participantName,
          });
        });

        // Fill missing participants with TBD
        while (participants.length < 2) {
          participants.push({
            id: `TBD-${match.id}-${participants.length + 1}`,
            resultText: null,
            isWinner: false,
            status: null,
            name: 'TBD',
          });
        }
      }

      return {
        id: match.id,
        name: this.getMatchName(match.round, match.matchNumber, matches.length),
        nextMatchId,
        tournamentRoundText: this.getRoundName(match.round, match.matchNumber),
        startTime: match.matchDate?.toISOString() || '',
        state: this.mapMatchState(match.status),
        participants,
      };
    });

    const totalRounds = Math.max(...matches.map((m) => m.round));

    return {
      tournamentId,
      format: 'SINGLE_ELIMINATION',
      totalRounds,
      totalMatches: matches.length,
      matches: bracketMatches,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getMatchName(round: number, matchNumber: number, totalMatches: number): string {
    if (matchNumber === 99) return '3rd Place';

    const maxRound = Math.ceil(Math.log2(totalMatches));

    if (round === maxRound) return 'Final';
    if (round === maxRound - 1) return `SF${matchNumber}`;
    if (round === maxRound - 2) return `QF${matchNumber}`;

    return `R${round} M${matchNumber}`;
  }

  private getRoundName(round: number, matchNumber: number): string {
    if (matchNumber === 99) return 'Third Place';

    if (round === 1) return 'Round of 32';
    if (round === 2) return 'Round of 16';
    if (round === 3) return 'Quarter Final';
    if (round === 4) return 'Semi Final';
    if (round === 5) return 'Final';

    return `Round ${round}`;
  }

  private mapMatchState(status: MatchStatus): BracketMatchState {
    switch (status) {
      case MatchStatus.SCHEDULED:
        return 'SCHEDULED';
      case MatchStatus.IN_PROGRESS:
        return 'IN_PROGRESS';
      case MatchStatus.COMPLETED:
        return 'COMPLETED';
      case MatchStatus.CANCELLED:
        return 'CANCELLED';
      default:
        return 'SCHEDULED';
    }
  }

}
