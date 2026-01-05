/**
 * Tournament Service
 * Handles business logic for tournament operations
 */

import { PrismaClient, TournamentStatus, ParticipantStatus, Prisma } from '@prisma/client';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentQueryDto,
  TournamentResponseDto,
  PaginatedTournamentsDto,
  AddParticipantDto,
  UpdateParticipantDto,
  BulkImportParticipantDto,
  ParticipantResponseDto,
  PaginatedParticipantsDto,
  RequestContext,
} from '../domain/tournament.types';

export class TournamentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new tournament
   */
  async createTournament(
    dto: CreateTournamentDto,
    ctx: RequestContext
  ): Promise<TournamentResponseDto> {
    // Only admins can create tournaments
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể tạo giải đấu');
    }

    // Validate configuration
    this.validateTournamentConfig(dto);

    // Create tournament
    const tournament = await this.prisma.tournament.create({
      data: {
        name: dto.name,
        description: dto.description,
        game: dto.game || 'TABLE_TENNIS',
        gameType: dto.gameType,
        registrationStartTime: dto.registrationStartTime
          ? new Date(dto.registrationStartTime)
          : undefined,
        isTentative: dto.isTentative ?? false,
        singleStageConfig: dto.singleStageConfig
          ? (dto.singleStageConfig as any)
          : undefined,
        twoStagesConfig: dto.twoStagesConfig
          ? (dto.twoStagesConfig as any)
          : undefined,
        status: dto.status || TournamentStatus.PENDING,
      },
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });

    return this.mapToResponseDto(tournament);
  }

  /**
   * Get all tournaments with pagination and filters
   */
  async getTournaments(
    query: TournamentQueryDto,
    ctx: RequestContext
  ): Promise<PaginatedTournamentsDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.TournamentWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.gameType) {
      where.gameType = query.gameType;
    }

    // Non-admins can only see published tournaments
    if (ctx.user.role !== 'ADMIN') {
      where.status = {
        in: [TournamentStatus.PENDING, TournamentStatus.IN_PROGRESS, TournamentStatus.COMPLETED],
      };
    }

    // Get tournaments with count
    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          _count: {
            select: {
              participants: true,
              matches: true,
            },
          },
        },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return {
      data: tournaments.map((t) => this.mapToResponseDto(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tournament by ID
   */
  async getTournamentById(
    id: string,
    ctx: RequestContext
  ): Promise<TournamentResponseDto> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    // Non-admins can only view published tournaments
    if (
      ctx.user.role !== 'ADMIN' &&
      tournament.status === TournamentStatus.DRAFT
    ) {
      throw new Error('Không tìm thấy giải đấu');
    }

    return this.mapToResponseDto(tournament);
  }

  /**
   * Update tournament
   */
  async updateTournament(
    id: string,
    dto: UpdateTournamentDto,
    ctx: RequestContext
  ): Promise<TournamentResponseDto> {
    // Only admins can update tournaments
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể cập nhật giải đấu');
    }

    // Check if tournament exists
    const existing = await this.prisma.tournament.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    // Cannot update if tournament is completed or cancelled
    if (
      existing.status === TournamentStatus.COMPLETED ||
      existing.status === TournamentStatus.CANCELLED
    ) {
      throw new Error('Không thể cập nhật giải đấu đã hoàn thành hoặc đã hủy');
    }

    // Validate configuration if provided
    if (dto.singleStageConfig || dto.twoStagesConfig) {
      const validateDto: CreateTournamentDto = {
        name: existing.name,
        gameType: existing.gameType,
        singleStageConfig: dto.singleStageConfig,
        twoStagesConfig: dto.twoStagesConfig,
      };
      this.validateTournamentConfig(validateDto);
    }

    // Update tournament
    const updated = await this.prisma.tournament.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        registrationStartTime: dto.registrationStartTime
          ? new Date(dto.registrationStartTime)
          : undefined,
        isTentative: dto.isTentative,
        singleStageConfig: dto.singleStageConfig
          ? (dto.singleStageConfig as any)
          : undefined,
        twoStagesConfig: dto.twoStagesConfig
          ? (dto.twoStagesConfig as any)
          : undefined,
      },
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete tournament (soft delete)
   */
  async deleteTournament(id: string, ctx: RequestContext): Promise<void> {
    // Only admins can delete tournaments
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể xóa giải đấu');
    }

    // Check if tournament exists
    const existing = await this.prisma.tournament.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    // Soft delete
    await this.prisma.tournament.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // ============================================
  // Helper Methods
  // ============================================

  private validateTournamentConfig(dto: CreateTournamentDto): void {
    if (dto.gameType === 'SINGLE_STAGE') {
      if (!dto.singleStageConfig) {
        throw new Error('Cấu hình giai đoạn đơn là bắt buộc cho giải đấu SINGLE_STAGE');
      }

      const config = dto.singleStageConfig;

      // Validate match format
      if (!config.matchFormat) {
        throw new Error('Cấu hình định dạng trận đấu là bắt buộc');
      }
      this.validateMatchFormat(config.matchFormat);

      if (config.format === 'SINGLE_ELIMINATION' && !config.singleEliminationConfig) {
        throw new Error('Cấu hình loại trực tiếp là bắt buộc');
      }

      if (config.format === 'ROUND_ROBIN' && !config.roundRobinConfig) {
        throw new Error('Cấu hình vòng tròn là bắt buộc');
      }
    }

    if (dto.gameType === 'TWO_STAGES') {
      if (!dto.twoStagesConfig) {
        throw new Error('Cấu hình hai giai đoạn là bắt buộc cho giải đấu TWO_STAGES');
      }

      const config = dto.twoStagesConfig;
      if (!config.groupStage || !config.finalStage) {
        throw new Error('Cả cấu hình vòng bảng và vòng chung kết đều là bắt buộc');
      }

      // Validate match formats
      if (!config.groupStage.matchFormat) {
        throw new Error('Cấu hình định dạng trận đấu cho vòng bảng là bắt buộc');
      }
      this.validateMatchFormat(config.groupStage.matchFormat);

      if (!config.finalStage.matchFormat) {
        throw new Error('Cấu hình định dạng trận đấu cho vòng chung kết là bắt buộc');
      }
      this.validateMatchFormat(config.finalStage.matchFormat);

      // Validate group stage
      if (config.groupStage.participantsPerGroup < 2 || config.groupStage.participantsPerGroup > 20) {
        throw new Error('Số người chơi mỗi bảng phải từ 2 đến 20');
      }

      if (config.groupStage.participantsAdvancing >= config.groupStage.participantsPerGroup) {
        throw new Error('Số người thăng hạng phải nhỏ hơn số người chơi mỗi bảng');
      }
    }
  }

  private validateMatchFormat(format: any): void {
    if (!format.bestOf || ![3, 5, 7].includes(format.bestOf)) {
      throw new Error('bestOf phải là 3, 5 hoặc 7');
    }

    if (!format.pointsToWin || ![11, 21].includes(format.pointsToWin)) {
      throw new Error('pointsToWin phải là 11 hoặc 21');
    }

    if (typeof format.deuceRule !== 'boolean') {
      throw new Error('deuceRule phải là boolean');
    }

    if (!format.minLeadToWin || format.minLeadToWin < 1) {
      throw new Error('minLeadToWin phải lớn hơn 0');
    }
  }

  private mapToResponseDto(tournament: any): TournamentResponseDto {
    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      game: tournament.game,
      gameType: tournament.gameType,
      status: tournament.status,
      registrationStartTime: tournament.registrationStartTime,
      isTentative: tournament.isTentative,
      singleStageConfig: tournament.singleStageConfig as any,
      twoStagesConfig: tournament.twoStagesConfig as any,
      participantsLocked: tournament.participantsLocked,
      challongeId: tournament.challongeId,
      challongeUrl: tournament.challongeUrl,
      lastSyncedAt: tournament.lastSyncedAt,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
      participantsCount: tournament._count?.participants,
      matchesCount: tournament._count?.matches,
    };
  }

  // ============================================
  // Participant Methods
  // ============================================

  /**
   * Add a participant to tournament
   */
  async addParticipant(
    tournamentId: string,
    dto: AddParticipantDto,
    ctx: RequestContext
  ): Promise<ParticipantResponseDto> {
    // Only admins can add participants
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể thêm người tham gia');
    }

    // Check if tournament exists and is not locked
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    if (tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia giải đấu đã bị khóa');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Check if user is already a participant
    const existing = await this.prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new Error('Người dùng đã là người tham gia');
    }

    const userSelect = {
      id: true,
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
      ...(ctx.user.role === 'ADMIN' ? { phone: true } : {}),
    };

    // Create participant
    const participant = await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: dto.userId,
        groupId: dto.groupId,
        seed: dto.seed,
        status: ParticipantStatus.REGISTERED,
      },
      include: {
        user: {
          select: userSelect,
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToParticipantDto(participant);
  }

  /**
   * Get tournament participants with pagination
   */
  async getParticipants(
    tournamentId: string,
    page: number = 1,
    limit: number = 50,
    ctx: RequestContext
  ): Promise<PaginatedParticipantsDto> {
    // Check if tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    // Non-admins can only view published tournaments
    if (
      ctx.user.role !== 'ADMIN' &&
      tournament.status === TournamentStatus.DRAFT
    ) {
      throw new Error('Không tìm thấy giải đấu');
    }

    const skip = (page - 1) * limit;
    const userSelect = {
      id: true,
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
      nickname: true,
      ratingPoints: true,
      totalMatches: true,
      winRate: true,
      ...(ctx.user.role === 'ADMIN' ? { phone: true } : {}),
    };

    const [participants, total] = await Promise.all([
      this.prisma.tournamentParticipant.findMany({
        where: {
          tournamentId,
          isVirtual: false,  // Exclude virtual participants (placeholders for bracket rounds)
        },
        skip,
        take: limit,
        orderBy: [{ seed: 'asc' }, { registeredAt: 'asc' }],
        include: {
          user: {
            select: userSelect,
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.tournamentParticipant.count({
        where: {
          tournamentId,
          isVirtual: false,  // Exclude virtual participants from count
        },
      }),
    ]);

    return {
      data: participants.map((p) => this.mapToParticipantDto(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a participant
   */
  async updateParticipant(
    tournamentId: string,
    participantId: string,
    dto: UpdateParticipantDto,
    ctx: RequestContext
  ): Promise<ParticipantResponseDto> {
    // Only admins can update participants
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể cập nhật người tham gia');
    }

    // Check if tournament exists and is not locked (unless only updating status)
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    if (tournament.participantsLocked && (dto.groupId !== undefined || dto.seed !== undefined)) {
      throw new Error('Danh sách người tham gia giải đấu đã bị khóa. Chỉ có thể cập nhật trạng thái.');
    }

    // Check if participant exists
    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.tournamentId !== tournamentId) {
      throw new Error('Không tìm thấy người tham gia');
    }

    // Update participant
    const updated = await this.prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        groupId: dto.groupId,
        seed: dto.seed,
        status: dto.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            ...(ctx.user.role === 'ADMIN' ? { phone: true } : {}),
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToParticipantDto(updated);
  }

  /**
   * Remove a participant
   */
  async removeParticipant(
    tournamentId: string,
    participantId: string,
    ctx: RequestContext
  ): Promise<void> {
    // Only admins can remove participants
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể xóa người tham gia');
    }

    // Check if tournament exists and is not locked
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    if (tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia giải đấu đã bị khóa');
    }

    // Check if participant exists
    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.tournamentId !== tournamentId) {
      throw new Error('Không tìm thấy người tham gia');
    }

    // Delete participant
    await this.prisma.tournamentParticipant.delete({
      where: { id: participantId },
    });
  }

  /**
   * Bulk import participants
   */
  async bulkImportParticipants(
    tournamentId: string,
    participants: BulkImportParticipantDto[],
    ctx: RequestContext
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    // Only admins can bulk import
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể nhập hàng loạt người tham gia');
    }

    // Check if tournament exists and is not locked
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    if (tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia giải đấu đã bị khóa');
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const dto of participants) {
      try {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
          where: { id: dto.userId },
        });

        if (!user) {
          errors.push(`User ${dto.userId} not found`);
          failed++;
          continue;
        }

        // Check if already participant
        const existing = await this.prisma.tournamentParticipant.findUnique({
          where: {
            tournamentId_userId: {
              tournamentId,
              userId: dto.userId,
            },
          },
        });

        if (existing) {
          errors.push(`User ${dto.userId} is already a participant`);
          failed++;
          continue;
        }

        // Create participant
        await this.prisma.tournamentParticipant.create({
          data: {
            tournamentId,
            userId: dto.userId,
            seed: dto.seed,
            status: ParticipantStatus.REGISTERED,
          },
        });

        success++;
      } catch (error) {
        errors.push(`Error adding user ${dto.userId}: ${error}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  /**
   * Lock tournament participants
   */
  async lockParticipants(
    tournamentId: string,
    ctx: RequestContext
  ): Promise<TournamentResponseDto> {
    // Only admins can lock participants
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể khóa danh sách người tham gia');
    }

    // Check if tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    if (tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia đã được khóa');
    }

    if (tournament._count.participants === 0) {
      throw new Error('Không thể khóa giải đấu không có người tham gia');
    }

    // Lock participants
    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participantsLocked: true,
      },
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Unlock tournament participants
   */
  async unlockParticipants(
    tournamentId: string,
    ctx: RequestContext
  ): Promise<TournamentResponseDto> {
    // Only admins can unlock participants
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể mở khóa danh sách người tham gia');
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            participants: true,
            groups: true,
            matches: true,
          },
        },
      },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Không tìm thấy giải đấu');
    }

    if (!tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia chưa được khóa');
    }

    if (tournament._count.groups > 0) {
      throw new Error('Không thể mở khóa danh sách người tham gia sau khi đã tạo bảng đấu');
    }

    if (tournament._count.matches > 0) {
      throw new Error('Không thể mở khóa danh sách người tham gia sau khi đã tạo trận đấu');
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participantsLocked: false,
      },
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  private mapToParticipantDto(participant: any): ParticipantResponseDto {
    return {
      id: participant.id,
      tournamentId: participant.tournamentId,
      userId: participant.userId,
      groupId: participant.groupId,
      seed: participant.seed,
      status: participant.status,
      finalRank: participant.finalRank,
      createdAt: participant.registeredAt,
      user: participant.user ? {
        id: participant.user.id,
        email: participant.user.email,
        phone: participant.user.phone,
        fullName: participant.user.displayName ||
                 `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim() ||
                 participant.user.email,
        nickname: participant.user.nickname,
        displayName: participant.user.displayName,
        ratingPoints: participant.user.ratingPoints,
        totalMatches: participant.user.totalMatches,
        winRate: participant.user.winRate,
      } : undefined,
      group: participant.group ? {
        id: participant.group.id,
        name: participant.group.name,
      } : undefined,
    };
  }
}
