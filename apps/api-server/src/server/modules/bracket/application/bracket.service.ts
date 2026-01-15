/**
 * Bracket Service
 *
 * Business logic for knockout bracket generation and resolution
 */

import {
  BracketSourceType,
  MatchSideLabel,
  MatchStatus,
  StageType,
  prisma,
} from '@pingclub/database';
import { BadRequestException, NotFoundException } from '@/server/common/exceptions';
import { BracketView, SeedOrder } from '../domain/bracket.types';

export class BracketService {
  async generateBracket(stageId: string, options: {
    sourceType: 'CUSTOM' | 'RANDOM' | 'GROUP_RANK';
    sourceStageId?: string;
    size?: number;
    seedOrder?: SeedOrder;
    topNPerGroup?: number;
    wildcardCount?: number;
    bestOf?: number;
    pairs?: Array<{ sideA: string; sideB: string }>;
  }): Promise<void> {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        type: true,
        tournamentId: true,
      },
    });

    if (!stage) {
      throw new NotFoundException('Không tìm thấy stage');
    }

    if (stage.type !== StageType.KNOCKOUT) {
      throw new BadRequestException('Stage không phải knockout');
    }

    const existingMatches = await prisma.match.count({
      where: { stageId: stage.id },
    });
    if (existingMatches > 0) {
      throw new BadRequestException('Stage đã có match, không thể generate lại');
    }

    const sourceType = options.sourceType;
    const bestOf = options.bestOf ?? 1;

    let entrants: Array<{
      tournamentParticipantId: string;
      sourceGroupId?: string | null;
      sourceRank?: number | null;
      sourceSeed?: number | null;
    }> = [];

    if (sourceType === 'CUSTOM') {
      const pairs = options.pairs ?? [];
      if (pairs.length === 0) {
        throw new BadRequestException('Pairs là bắt buộc khi bốc thăm thủ công');
      }

      const flattened = pairs.flatMap((pair) => [pair.sideA, pair.sideB]);
      const normalized = flattened.map((id) => id.trim()).filter(Boolean);
      if (normalized.length !== flattened.length) {
        throw new BadRequestException('Participant ID không hợp lệ');
      }

      const unique = Array.from(new Set(normalized));
      if (unique.length !== normalized.length) {
        throw new BadRequestException('Danh sách participant bị trùng');
      }

      const participants = await prisma.tournamentParticipant.findMany({
        where: { id: { in: unique }, tournamentId: stage.tournamentId },
        select: { id: true },
      });

      if (participants.length !== unique.length) {
        throw new BadRequestException('Participant không hợp lệ');
      }

      for (let index = 0; index < normalized.length; index += 1) {
        entrants.push({
          tournamentParticipantId: normalized[index],
          sourceSeed: index + 1,
        });
      }

      const size = options.size ?? this.getNextPowerOfTwo(entrants.length);
      this.validateBracketSize(size, entrants.length);
    }

    if (sourceType === 'RANDOM') {
      const participants = await prisma.tournamentParticipant.findMany({
        where: { tournamentId: stage.tournamentId },
      });

      if (participants.length === 0) {
        throw new BadRequestException('Giải đấu chưa có participant');
      }

      const size = options.size ?? this.getNextPowerOfTwo(participants.length);
      this.validateBracketSize(size, participants.length);

      const shuffled = [...participants].sort(() => Math.random() - 0.5).slice(0, size);
      shuffled.forEach((participant, index) => {
        entrants.push({
          tournamentParticipantId: participant.id,
          sourceSeed: index + 1,
        });
      });
    }

    if (sourceType === 'GROUP_RANK') {
      if (!options.sourceStageId) {
        throw new BadRequestException('sourceStageId là bắt buộc');
      }
      if (!options.topNPerGroup) {
        throw new BadRequestException('topNPerGroup là bắt buộc');
      }

      const sourceStage = await prisma.stage.findUnique({
        where: { id: options.sourceStageId },
        select: {
          id: true,
          tournamentId: true,
        },
      });

      if (!sourceStage || sourceStage.tournamentId !== stage.tournamentId) {
        throw new BadRequestException('Stage nguồn không hợp lệ');
      }

      const groups = await prisma.group.findMany({
        where: { stageId: sourceStage.id },
        select: { id: true },
      });

      if (groups.length === 0) {
        throw new BadRequestException('Stage nguồn chưa có group');
      }

      const standings = await prisma.groupStanding.findMany({
        where: {
          groupId: { in: groups.map((group) => group.id) },
          rank: { not: null },
        },
        orderBy: [
          { rank: 'asc' },
          { matchPoints: 'desc' },
        ],
      });

      if (standings.length === 0) {
        throw new BadRequestException('Chưa có bảng xếp hạng để tạo bracket');
      }

      const topPerGroup = new Map<string, number>();
      standings.forEach((standing) => {
        const current = topPerGroup.get(standing.groupId) || 0;
        if (current < options.topNPerGroup!) {
          entrants.push({
            tournamentParticipantId: standing.tournamentParticipantId,
            sourceGroupId: standing.groupId,
            sourceRank: standing.rank ?? undefined,
          });
          topPerGroup.set(standing.groupId, current + 1);
        }
      });

      const wildcardCount = options.wildcardCount ?? 0;
      if (wildcardCount > 0) {
        const taken = new Set(entrants.map((entry) => entry.tournamentParticipantId));
        const wildcards = standings
          .filter((standing) => !taken.has(standing.tournamentParticipantId))
          .slice(0, wildcardCount);
        wildcards.forEach((standing) => {
          entrants.push({
            tournamentParticipantId: standing.tournamentParticipantId,
            sourceGroupId: standing.groupId,
            sourceRank: standing.rank ?? undefined,
          });
        });
      }

      const size = options.size ?? this.getNextPowerOfTwo(entrants.length);
      this.validateBracketSize(size, entrants.length);
    }

    const size = options.size ?? this.getNextPowerOfTwo(entrants.length);
    const seedOrder = options.seedOrder ?? 'STANDARD';
    const orderedEntrants = seedOrder === 'REVERSE' ? [...entrants].reverse() : entrants;

    const rounds = Math.log2(size);
    if (!Number.isInteger(rounds)) {
      throw new BadRequestException('Size không hợp lệ');
    }

    const matches: Array<{ id: string; roundNo: number; matchNo: number }> = [];

    await prisma.$transaction(async (tx) => {
      for (let round = 1; round <= rounds; round += 1) {
        const matchesInRound = size / Math.pow(2, round);
        for (let matchIndex = 1; matchIndex <= matchesInRound; matchIndex += 1) {
          const match = await tx.match.create({
            data: {
              stage: { connect: { id: stage.id } },
              bestOf,
              status: MatchStatus.SCHEDULED,
              roundNo: round,
              matchNo: matchIndex,
            },
          });

          await tx.matchSide.createMany({
            data: [
              { matchId: match.id, side: MatchSideLabel.A },
              { matchId: match.id, side: MatchSideLabel.B },
            ],
          });

          matches.push({ id: match.id, roundNo: round, matchNo: matchIndex });
        }
      }

      if (sourceType === 'CUSTOM' || sourceType === 'RANDOM') {
        for (let index = 0; index < orderedEntrants.length; index += 1) {
          await tx.tournamentParticipant.update({
            where: { id: orderedEntrants[index].tournamentParticipantId },
            data: { seed: orderedEntrants[index].sourceSeed ?? index + 1 },
          });
        }
      }

      const round1Matches = matches.filter((match) => match.roundNo === 1);
      let entrantIndex = 0;
      for (const match of round1Matches) {
        const slots: Array<{ side: MatchSideLabel; entrant?: typeof orderedEntrants[number] }> = [
          { side: MatchSideLabel.A, entrant: orderedEntrants[entrantIndex] },
          { side: MatchSideLabel.B, entrant: orderedEntrants[entrantIndex + 1] },
        ];
        entrantIndex += 2;

        for (const slot of slots) {
          if (!slot.entrant) {
            continue;
          }

          await tx.bracketSlot.create({
            data: {
              targetMatch: { connect: { id: match.id } },
              targetSide: slot.side,
              sourceType: sourceType === 'GROUP_RANK'
                ? BracketSourceType.GROUP_RANK
                : BracketSourceType.SEED,
              sourceSeed: slot.entrant.sourceSeed ?? null,
              sourceRank: slot.entrant.sourceRank ?? null,
              ...(slot.entrant.sourceGroupId
                ? {
                  sourceGroup: {
                    connect: { id: slot.entrant.sourceGroupId },
                  },
                }
                : {}),
            },
          });
        }
      }

      for (let round = 2; round <= rounds; round += 1) {
        const currentMatches = matches.filter((match) => match.roundNo === round);
        const previousMatches = matches.filter((match) => match.roundNo === round - 1);

        for (let index = 0; index < currentMatches.length; index += 1) {
          const targetMatch = currentMatches[index];
          const sourceA = previousMatches[index * 2];
          const sourceB = previousMatches[index * 2 + 1];

          await tx.bracketSlot.createMany({
            data: [
              {
                targetMatchId: targetMatch.id,
                targetSide: MatchSideLabel.A,
                sourceType: BracketSourceType.MATCH_WINNER,
                sourceMatchId: sourceA.id,
              },
              {
                targetMatchId: targetMatch.id,
                targetSide: MatchSideLabel.B,
                sourceType: BracketSourceType.MATCH_WINNER,
                sourceMatchId: sourceB.id,
              },
            ],
          });
        }
      }
    });

    if (sourceType === 'CUSTOM' || sourceType === 'RANDOM') {
      await this.resolveBracket(stageId);
    }
  }

  async getBracket(stageId: string): Promise<BracketView> {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!stage) {
      throw new NotFoundException('Không tìm thấy stage');
    }

    const matches = await prisma.match.findMany({
      where: { stageId },
      include: {
        sides: {
          include: {
            members: {
              include: {
                tournamentParticipant: true,
              },
            },
          },
        },
      },
      orderBy: [{ roundNo: 'asc' }, { matchNo: 'asc' }],
    });

    const slots = await prisma.bracketSlot.findMany({
      where: { targetMatch: { stageId } },
      include: {
        targetMatch: {
          include: {
            sides: {
              include: {
                members: {
                  include: {
                    tournamentParticipant: true,
                  },
                },
              },
            },
            stage: true,
          },
        },
      },
    });

    const slotViews = slots.map((slot) => {
      const targetSide = slot.targetSide;
      const targetMatch = slot.targetMatch;
      const matchSide = targetMatch.sides.find((side) => side.side === targetSide);
      const member = matchSide?.members[0];

      return {
        id: slot.id,
        targetMatchId: slot.targetMatchId,
        targetSide: slot.targetSide,
        sourceType: slot.sourceType,
        sourceMatchId: slot.sourceMatchId,
        sourceGroupId: slot.sourceGroupId,
        sourceRank: slot.sourceRank,
        sourceSeed: slot.sourceSeed,
        resolved: Boolean(member),
        participant: member
          ? {
            id: member.tournamentParticipantId,
            displayName: member.tournamentParticipant.displayName,
          }
          : null,
      };
    });

    const matchViews = matches.map((match) => ({
      id: match.id,
      roundNo: match.roundNo,
      matchNo: match.matchNo,
      status: match.status,
      sides: match.sides.map((side) => ({
        side: side.side,
        participants: side.members.map((member) => ({
          id: member.tournamentParticipantId,
          displayName: member.tournamentParticipant.displayName,
        })),
      })),
    }));

    return {
      matches: matchViews,
      slots: slotViews,
    };
  }

  async resolveBracket(stageId: string): Promise<number> {
    const slots = await prisma.bracketSlot.findMany({
      where: { targetMatch: { stageId } },
      include: {
        targetMatch: {
          include: {
            sides: {
              include: {
                members: true,
              },
            },
            stage: true,
          },
        },
        sourceMatch: {
          include: {
            sides: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    let resolvedCount = 0;

    for (const slot of slots) {
      const matchSide = slot.targetMatch.sides.find((side) => side.side === slot.targetSide);
      if (!matchSide || matchSide.members.length > 0) {
        continue;
      }

      let participantIds: string[] = [];

      if (slot.sourceType === BracketSourceType.SEED && slot.sourceSeed) {
        const participant = await prisma.tournamentParticipant.findFirst({
          where: {
            tournamentId: slot.targetMatch.stage.tournamentId,
            seed: slot.sourceSeed,
          },
        });
        if (participant) {
          participantIds = [participant.id];
        }
      }

      if (slot.sourceType === BracketSourceType.GROUP_RANK && slot.sourceGroupId && slot.sourceRank) {
        const standing = await prisma.groupStanding.findFirst({
          where: {
            groupId: slot.sourceGroupId,
            rank: slot.sourceRank,
          },
        });
        if (standing) {
          participantIds = [standing.tournamentParticipantId];
        }
      }

      if (slot.sourceType === BracketSourceType.MATCH_WINNER && slot.sourceMatch) {
        const winnerSide = slot.sourceMatch.sides.find((side) => side.isWinner === true);
        if (winnerSide) {
          participantIds = winnerSide.members.map((member) => member.tournamentParticipantId);
        }
      }

      if (participantIds.length === 0) {
        continue;
      }

      await prisma.matchSideMember.createMany({
        data: participantIds.map((participantId) => ({
          matchSideId: matchSide.id,
          tournamentParticipantId: participantId,
        })),
        skipDuplicates: true,
      });

      resolvedCount += 1;
    }

    return resolvedCount;
  }

  private validateBracketSize(size: number, entrantsCount: number) {
    if (size < entrantsCount) {
      throw new BadRequestException('Size nhỏ hơn số lượng người vào bracket');
    }

    const isPowerOfTwo = (value: number) => (value & (value - 1)) === 0;
    if (!isPowerOfTwo(size)) {
      throw new BadRequestException('Size phải là lũy thừa của 2');
    }
  }

  private getNextPowerOfTwo(value: number) {
    let size = 1;
    while (size < value) {
      size *= 2;
    }
    return size;
  }
}
