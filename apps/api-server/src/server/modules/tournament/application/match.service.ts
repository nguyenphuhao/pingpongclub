/**
 * Match Service
 * Generic service for tournament match operations
 * Supports both SINGLE_ELIMINATION (FINAL stage) and ROUND_ROBIN (GROUP stage) matches
 */

import { PrismaClient, MatchStatus, TournamentStage } from '@prisma/client';
import { RequestContext } from '../domain/tournament.types';
import {
  MatchResponseDto,
  MatchQueryDto,
  PaginatedMatchesDto,
  CreateMatchDto,
  UpdateMatchDto,
} from '../domain/match.types';

export class MatchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all matches for a tournament with filters
   * Supports both FINAL and GROUP stage matches
   */
  async getMatches(
    tournamentId: string,
    query: MatchQueryDto,
    ctx: RequestContext
  ): Promise<PaginatedMatchesDto> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tournamentId,
    };

    // Filter by stage (FINAL or GROUP)
    if (query.stage) {
      where.stage = query.stage;
    }

    // Filter by group
    if (query.groupId) {
      where.groupId = query.groupId;
    }

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by round
    if (query.round !== undefined) {
      where.round = query.round;
    }

    // Get matches with participants
    const [matches, total] = await Promise.all([
      this.prisma.tournamentMatch.findMany({
        where,
        skip,
        take: limit,
        include: {
          participants: {
            include: {
              participant: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      phone: true,
                      firstName: true,
                      lastName: true,
                      nickname: true,
                      displayName: true,
                      ratingPoints: true,
                    },
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          group: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: [
          { stage: 'asc' },
          { round: 'asc' },
          { matchNumber: 'asc' },
        ],
      }),
      this.prisma.tournamentMatch.count({ where }),
    ]);

    return {
      data: matches.map((m) => this.mapToResponseDto(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single match by ID
   */
  async getMatch(
    tournamentId: string,
    matchId: string,
    ctx: RequestContext
  ): Promise<MatchResponseDto> {
    const match = await this.prisma.tournamentMatch.findFirst({
      where: {
        id: matchId,
        tournamentId,
      },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    nickname: true,
                    displayName: true,
                    ratingPoints: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        group: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error('Không tìm thấy trận đấu');
    }

    return this.mapToResponseDto(match);
  }

  /**
   * Get matches by stage
   * Helper method to get only FINAL or GROUP stage matches
   */
  async getMatchesByStage(
    tournamentId: string,
    stage: TournamentStage,
    ctx: RequestContext
  ): Promise<MatchResponseDto[]> {
    const matches = await this.prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        stage,
      },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    nickname: true,
                    displayName: true,
                    ratingPoints: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        group: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    return matches.map((m) => this.mapToResponseDto(m));
  }

  /**
   * Get matches by group
   * Helper method to get all matches for a specific group
   */
  async getMatchesByGroup(
    tournamentId: string,
    groupId: string,
    ctx: RequestContext
  ): Promise<MatchResponseDto[]> {
    const matches = await this.prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        groupId,
        stage: 'GROUP',
      },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    nickname: true,
                    displayName: true,
                    ratingPoints: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        group: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    return matches.map((m) => this.mapToResponseDto(m));
  }

  /**
   * Get match statistics for a tournament
   */
  async getMatchStats(
    tournamentId: string,
    ctx: RequestContext
  ): Promise<{
    total: number;
    byStage: { stage: string; count: number }[];
    byStatus: { status: string; count: number }[];
  }> {
    const [total, byStage, byStatus] = await Promise.all([
      this.prisma.tournamentMatch.count({
        where: { tournamentId },
      }),
      this.prisma.tournamentMatch.groupBy({
        by: ['stage'],
        where: { tournamentId },
        _count: true,
      }),
      this.prisma.tournamentMatch.groupBy({
        by: ['status'],
        where: { tournamentId },
        _count: true,
      }),
    ]);

    return {
      total,
      byStage: byStage.map((s) => ({
        stage: s.stage,
        count: s._count,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
    };
  }

  /**
   * Create a single match manually
   * Supports creating matches with or without participants (TBD placeholders)
   */
  async createMatch(
    tournamentId: string,
    dto: CreateMatchDto,
    ctx: RequestContext
  ): Promise<MatchResponseDto> {
    // Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể tạo trận đấu');
    }

    // Validate tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    // Validate group if stage = GROUP
    if (dto.stage === 'GROUP') {
      if (!dto.groupId) {
        throw new Error('groupId là bắt buộc cho GROUP stage matches');
      }

      const group = await this.prisma.tournamentGroup.findFirst({
        where: {
          id: dto.groupId,
          tournamentId,
        },
      });

      if (!group) {
        throw new Error('Không tìm thấy bảng đấu');
      }
    }

    // Validate participants if provided
    if (dto.participants && dto.participants.length > 0) {
      const participantIds = dto.participants.map((p) => p.participantId);
      const participants = await this.prisma.tournamentParticipant.findMany({
        where: {
          id: { in: participantIds },
          tournamentId,
        },
      });

      if (participants.length !== participantIds.length) {
        throw new Error('Một số người chơi không thuộc giải đấu này');
      }

      // If GROUP stage, validate participants belong to the group
      if (dto.stage === 'GROUP' && dto.groupId) {
        const wrongGroup = participants.find((p) => p.groupId !== dto.groupId);
        if (wrongGroup) {
          throw new Error('Người chơi phải thuộc cùng bảng đấu');
        }
      }

      // Validate position uniqueness
      const positions = dto.participants.map((p) => p.position);
      if (new Set(positions).size !== positions.length) {
        throw new Error('Vị trí người chơi phải là duy nhất (1 và 2)');
      }
    }

    // Create match with transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create match
      const match = await tx.tournamentMatch.create({
        data: {
          tournamentId,
          groupId: dto.groupId || null,
          stage: dto.stage,
          round: dto.round,
          matchNumber: dto.matchNumber,
          bracketPosition: dto.bracketPosition,
          matchDate: dto.matchDate ? new Date(dto.matchDate) : null,
          courtNumber: dto.courtNumber,
          status: dto.status || MatchStatus.SCHEDULED,
          isPlacementMatch: dto.isPlacementMatch || false,
          placementRank: dto.placementRank,
        },
      });

      // Create participants if provided
      if (dto.participants && dto.participants.length > 0) {
        await tx.tournamentMatchParticipant.createMany({
          data: dto.participants.map((p) => ({
            matchId: match.id,
            participantId: p.participantId,
            position: p.position,
          })),
        });
      }

      return match;
    });

    // Return full match details
    return this.getMatch(tournamentId, result.id, ctx);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private mapToResponseDto(match: any): MatchResponseDto {
    return {
      id: match.id,
      tournamentId: match.tournamentId,
      groupId: match.groupId,
      stage: match.stage,
      round: match.round,
      matchNumber: match.matchNumber,
      bracketPosition: match.bracketPosition,
      matchDate: match.matchDate,
      courtNumber: match.courtNumber,
      status: match.status,
      winnerId: match.winnerId,
      finalScore: match.finalScore,
      gameScores: match.gameScores ? (match.gameScores as any) : undefined,
      isPlacementMatch: match.isPlacementMatch,
      placementRank: match.placementRank,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      participants: match.participants.map((mp: any) => {
        const participantUser = mp.participant.user;

        return {
          id: mp.id,
          participantId: mp.participantId,
          position: mp.position,
          isWinner: mp.isWinner,
          score: mp.score,
          participant: {
            id: mp.participant.id,
            tournamentId: mp.participant.tournamentId,
            userId: mp.participant.userId,
            groupId: mp.participant.groupId,
            seed: mp.participant.seed,
            status: mp.participant.status,
            displayName: mp.participant.displayName,
            isVirtual: Boolean(mp.participant.isVirtual),
            user: participantUser
              ? {
                  id: participantUser.id,
                  email: participantUser.email,
                  phone: participantUser.phone,
                  firstName: participantUser.firstName,
                  lastName: participantUser.lastName,
                  nickname: participantUser.nickname,
                  displayName: participantUser.displayName,
                  ratingPoints: participantUser.ratingPoints,
                }
              : null,
          },
        };
      }),
      group: match.group ? {
        id: match.group.id,
        name: match.group.name,
        displayName: match.group.displayName,
      } : undefined,
    };
  }

  /**
   * Delete all matches for a tournament
   * Useful for regenerating brackets/groups from scratch
   */
  async deleteAllMatches(
    tournamentId: string,
    ctx: RequestContext
  ): Promise<{ deletedCount: number; message: string }> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể xóa trận đấu');
    }

    // 2. Validate tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Tournament not found');
    }

    // 3. Check if tournament has any completed matches
    const completedMatchCount = await this.prisma.tournamentMatch.count({
      where: {
        tournamentId,
        status: MatchStatus.COMPLETED,
      },
    });

    if (completedMatchCount > 0) {
      throw new Error(
        `Không thể xóa tất cả trận đấu vì đã có ${completedMatchCount} trận đã hoàn thành. Chỉ có thể xóa từng trận riêng lẻ.`
      );
    }

    // 4. Delete all matches and their participants in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // First, delete all match participants
      await tx.tournamentMatchParticipant.deleteMany({
        where: {
          match: {
            tournamentId,
          },
        },
      });

      // Then delete all matches
      const deleteResult = await tx.tournamentMatch.deleteMany({
        where: { tournamentId },
      });

      // Delete all virtual participants (they were created for matches)
      await tx.tournamentParticipant.deleteMany({
        where: {
          tournamentId,
          isVirtual: true,
        },
      });

      return deleteResult.count;
    });

    return {
      deletedCount: result,
      message: `Đã xóa ${result} trận đấu thành công`,
    };
  }

  /**
   * Update match details (schedule and participants)
   * Allows customizing matchDate, courtNumber, and swapping participants
   */
  async updateMatch(
    tournamentId: string,
    matchId: string,
    dto: UpdateMatchDto,
    ctx: RequestContext
  ): Promise<MatchResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể cập nhật trận đấu');
    }

    // 2. Validate match exists and belongs to tournament
    const match = await this.prisma.tournamentMatch.findFirst({
      where: {
        id: matchId,
        tournamentId,
      },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error('Không tìm thấy trận đấu');
    }

    // 3. Validate match is not completed
    if (match.status === MatchStatus.COMPLETED) {
      throw new Error('Không thể cập nhật trận đấu đã hoàn thành');
    }

    // 4. Update in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update match details
      const updateData: any = {};

      if (dto.matchDate !== undefined) {
        updateData.matchDate = dto.matchDate ? new Date(dto.matchDate) : null;
      }

      if (dto.courtNumber !== undefined) {
        updateData.courtNumber = dto.courtNumber;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.tournamentMatch.update({
          where: { id: matchId },
          data: updateData,
        });
      }

      // Update participants if provided
      if (dto.participants && dto.participants.length > 0) {
        // Validate participants exist and belong to tournament
        const participantIds = dto.participants.map(p => p.participantId);
        const validParticipants = await tx.tournamentParticipant.findMany({
          where: {
            id: { in: participantIds },
            tournamentId,
          },
        });

        if (validParticipants.length !== participantIds.length) {
          throw new Error('Một số người tham gia không hợp lệ hoặc không thuộc giải đấu này');
        }

        // For GROUP stage, validate participants belong to the same group
        if (match.groupId) {
          const groupParticipants = validParticipants.filter(p => p.groupId === match.groupId);
          if (groupParticipants.length !== validParticipants.length) {
            throw new Error('Tất cả người tham gia phải thuộc cùng bảng đấu');
          }
        }

        // Delete existing participants
        await tx.tournamentMatchParticipant.deleteMany({
          where: { matchId },
        });

        // Create new participants
        await tx.tournamentMatchParticipant.createMany({
          data: dto.participants.map(p => ({
            matchId,
            participantId: p.participantId,
            position: p.position,
          })),
        });
      }
    });

    // 5. Return updated match
    return this.getMatch(tournamentId, matchId, ctx);
  }

  /**
   * Delete a single match
   */
  async deleteMatch(
    tournamentId: string,
    matchId: string,
    ctx: RequestContext
  ): Promise<{ message: string }> {
    // 1. Validate admin
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể xóa trận đấu');
    }

    // 2. Validate tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    // 3. Validate match exists and belongs to tournament
    const match = await this.prisma.tournamentMatch.findFirst({
      where: {
        id: matchId,
        tournamentId,
      },
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error('Không tìm thấy trận đấu');
    }

    // 4. Cannot delete COMPLETED matches (preserve history)
    if (match.status === MatchStatus.COMPLETED) {
      throw new Error('Không thể xóa trận đấu đã hoàn thành');
    }

    // 5. Delete match and participants in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete match participants
      await tx.tournamentMatchParticipant.deleteMany({
        where: { matchId },
      });

      // Delete the match
      await tx.tournamentMatch.delete({
        where: { id: matchId },
      });

      // Note: We don't delete virtual participants here
      // They might be used by other matches in the bracket
    });

    return {
      message: 'Đã xóa trận đấu thành công',
    };
  }
}
