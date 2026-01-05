/**
 * Group Service
 * Handles business logic for tournament group operations
 */

import { PrismaClient, GroupStatus, TournamentStatus, ParticipantStatus, MatchStatus, Prisma } from '@prisma/client';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryDto,
  GroupResponseDto,
  PaginatedGroupsDto,
  AddParticipantToGroupDto,
  ParticipantResponseDto,
  PaginatedParticipantsDto,
  GenerateMatchesDto,
  GenerateMatchesResponseDto,
  StandingsResponseDto,
  Pairing,
  MatchResponseDto,
  RequestContext,
  TwoStagesConfig,
  AutoGenerateGroupsDto,
  AutoGenerateGroupsResponseDto,
} from '../domain/tournament.types';
import { TieBreakService } from './tie-break.service';

export class GroupService {
  private prisma: PrismaClient;
  private tieBreakService: TieBreakService;

  constructor() {
    this.prisma = new PrismaClient();
    this.tieBreakService = new TieBreakService();
  }

  // ============================================
  // Group CRUD Operations
  // ============================================

  /**
   * Create a new group for a tournament
   */
  async createGroup(
    tournamentId: string,
    dto: CreateGroupDto,
    ctx: RequestContext,
  ): Promise<GroupResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể tạo bảng đấu');
    }

    // 2. Validate tournament exists and is TWO_STAGES
    const tournament = await this.validateTournamentForGroups(tournamentId);

    // 3. Validate tournament status (DRAFT or PENDING only)
    if (
      tournament.status !== TournamentStatus.DRAFT &&
      tournament.status !== TournamentStatus.PENDING
    ) {
      throw new Error('Không thể tạo bảng đấu cho giải đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 4. Get defaults from tournament config
    const config = tournament.twoStagesConfig as unknown as TwoStagesConfig;
    const participantsPerGroup = dto.participantsPerGroup ?? config?.groupStage?.participantsPerGroup ?? 4;
    const participantsAdvancing = dto.participantsAdvancing ?? config?.groupStage?.participantsAdvancing ?? 2;

    // 5. Validate participantsPerGroup range (2-20)
    if (participantsPerGroup < 2 || participantsPerGroup > 20) {
      throw new Error('Participants per group must be between 2 and 20');
    }

    // 6. Validate participantsAdvancing < participantsPerGroup
    if (participantsAdvancing >= participantsPerGroup) {
      throw new Error('Participants advancing must be less than participants per group');
    }

    // 7. Check group name uniqueness
    const existingGroup = await this.prisma.tournamentGroup.findFirst({
      where: {
        tournamentId,
        name: dto.name,
      },
    });

    if (existingGroup) {
      throw new Error('Đã tồn tại bảng đấu với tên này trong giải đấu');
    }

    // 8. Create group
    const group = await this.prisma.tournamentGroup.create({
      data: {
        tournamentId,
        name: dto.name,
        displayName: dto.displayName || `Group ${dto.name}`,
        participantsPerGroup,
        participantsAdvancing,
        status: GroupStatus.PENDING,
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

    return this.mapToGroupDto(group);
  }

  /**
   * Get all groups for a tournament with pagination
   */
  async getGroups(
    tournamentId: string,
    query: GroupQueryDto,
    ctx: RequestContext,
  ): Promise<PaginatedGroupsDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TournamentGroupWhereInput = {
      tournamentId,
    };

    if (query.status) {
      where.status = query.status;
    }

    // Fetch groups with counts
    const [groups, total] = await Promise.all([
      this.prisma.tournamentGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              participants: true,
              matches: true,
            },
          },
        },
      }),
      this.prisma.tournamentGroup.count({ where }),
    ]);

    return {
      data: groups.map((g) => this.mapToGroupDto(g)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single group by ID with optional details
   */
  async getGroupById(
    tournamentId: string,
    groupId: string,
    ctx: RequestContext,
    includeDetails: boolean = false,
  ): Promise<GroupResponseDto> {
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
        ...(includeDetails
          ? {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      displayName: true,
                      firstName: true,
                      lastName: true,
                      nickname: true,
                      ratingPoints: true,
                      ...(ctx.user.role === 'ADMIN' ? { phone: true } : {}),
                    },
                  },
                },
              },
              matches: {
                include: {
                  participants: {
                    include: {
                      participant: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    return this.mapToGroupDto(group, includeDetails);
  }

  /**
   * Update a group
   */
  async updateGroup(
    tournamentId: string,
    groupId: string,
    dto: UpdateGroupDto,
    ctx: RequestContext,
  ): Promise<GroupResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể cập nhật bảng đấu');
    }

    // 2. Validate group exists
    const existing = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (existing.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    // 3. Validate group status (cannot update if IN_PROGRESS/COMPLETED)
    if (existing.status !== GroupStatus.PENDING) {
      throw new Error('Không thể cập nhật bảng đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 4. Validate constraints
    const newParticipantsPerGroup = dto.participantsPerGroup ?? existing.participantsPerGroup;
    const newParticipantsAdvancing = dto.participantsAdvancing ?? existing.participantsAdvancing;

    if (newParticipantsPerGroup < 2 || newParticipantsPerGroup > 20) {
      throw new Error('Participants per group must be between 2 and 20');
    }

    if (newParticipantsAdvancing >= newParticipantsPerGroup) {
      throw new Error('Participants advancing must be less than participants per group');
    }

    // 5. Check if reducing participantsPerGroup below current count
    if (
      dto.participantsPerGroup &&
      dto.participantsPerGroup < existing._count.participants
    ) {
      throw new Error(
        `Không thể giảm số người chơi mỗi bảng xuống dưới số lượng hiện tại (${existing._count.participants})`,
      );
    }

    // 6. Update group
    const updated = await this.prisma.tournamentGroup.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        displayName: dto.displayName,
        participantsPerGroup: dto.participantsPerGroup,
        participantsAdvancing: dto.participantsAdvancing,
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

    return this.mapToGroupDto(updated);
  }

  /**
   * Delete a group
   */
  async deleteGroup(
    tournamentId: string,
    groupId: string,
    ctx: RequestContext,
  ): Promise<void> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể xóa bảng đấu');
    }

    // 2. Validate group exists
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        tournament: true,
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    // 3. Check if group has matches
    if (group._count.matches > 0) {
      throw new Error('Không thể xóa bảng đấu đã có trận đấu');
    }

    // 4. Check tournament status
    if (
      group.tournament.status === TournamentStatus.IN_PROGRESS ||
      group.tournament.status === TournamentStatus.COMPLETED
    ) {
      throw new Error('Không thể xóa bảng đấu từ giải đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 5. Remove group from all participants (set groupId = null)
    await this.prisma.tournamentParticipant.updateMany({
      where: { groupId },
      data: { groupId: null },
    });

    // 6. Delete group
    await this.prisma.tournamentGroup.delete({
      where: { id: groupId },
    });
  }

  // ============================================
  // Participant Assignment
  // ============================================

  /**
   * Add a participant to a group
   */
  async addParticipantToGroup(
    tournamentId: string,
    groupId: string,
    dto: AddParticipantToGroupDto,
    ctx: RequestContext,
  ): Promise<ParticipantResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể thêm người chơi vào bảng đấu');
    }

    // 2. Validate tournament exists and is TWO_STAGES
    const tournament = await this.validateTournamentForGroups(tournamentId);

    // 3. Validate tournament participants are locked
    if (!tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia phải được khóa trước khi phân vào bảng đấu');
    }

    // 4. Validate group exists and belongs to tournament
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    // 5. Validate group status is PENDING
    if (group.status !== GroupStatus.PENDING) {
      throw new Error('Không thể thêm người chơi vào bảng đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 6. Validate participant exists and belongs to tournament
    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: dto.participantId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participant.tournamentId !== tournamentId) {
      throw new Error('Người tham gia không thuộc giải đấu này');
    }

    // 7. Validate participant is not in another group
    if (participant.groupId && participant.groupId !== groupId) {
      throw new Error('Người tham gia đã có trong bảng đấu khác');
    }

    if (participant.groupId === groupId) {
      throw new Error('Người tham gia đã có trong bảng đấu này');
    }

    // 8. Validate group is not full
    if (group._count.participants >= group.participantsPerGroup) {
      throw new Error('Bảng đấu đã đầy');
    }

    // 9. Update participant with groupId
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

    const updated = await this.prisma.tournamentParticipant.update({
      where: { id: dto.participantId },
      data: { groupId },
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

    return this.mapToParticipantDto(updated);
  }

  /**
   * Remove a participant from a group
   */
  async removeParticipantFromGroup(
    tournamentId: string,
    groupId: string,
    participantId: string,
    ctx: RequestContext,
  ): Promise<void> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể xóa người chơi khỏi bảng đấu');
    }

    // 2. Validate group exists and status is PENDING
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    if (group.status !== GroupStatus.PENDING) {
      throw new Error('Không thể xóa người chơi khỏi bảng đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 3. Validate participant exists and is in this group
    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participant.groupId !== groupId) {
      throw new Error('Người tham gia không có trong bảng đấu này');
    }

    // 4. Update participant (set groupId = null)
    await this.prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: { groupId: null },
    });
  }

  /**
   * Get all participants in a group
   */
  async getGroupParticipants(
    tournamentId: string,
    groupId: string,
    page: number = 1,
    limit: number = 50,
    ctx: RequestContext,
  ): Promise<PaginatedParticipantsDto> {
    // Validate group exists
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
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
        where: { groupId },
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
        where: { groupId },
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

  // ============================================
  // Match Generation (Round Robin)
  // ============================================

  /**
   * Generate round robin matches for a group
   */
  async generateMatches(
    tournamentId: string,
    groupId: string,
    dto: GenerateMatchesDto,
    ctx: RequestContext,
  ): Promise<GenerateMatchesResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể tạo trận đấu');
    }

    // 2. Validate tournament exists and participants locked
    const tournament = await this.validateTournamentForGroups(tournamentId);

    if (!tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia phải được khóa trước khi tạo trận đấu');
    }

    // 3. Validate group exists, belongs to tournament, status is PENDING
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    // Validate group status
    if (group.status !== GroupStatus.PENDING) {
      throw new Error('Không thể tạo trận đấu cho bảng không ở trạng thái chờ');
    }

    // Check if matches already exist
    if (group._count.matches > 0) {
      throw new Error('Bảng đấu đã có trận đấu. Xóa chúng trước nếu muốn tạo lại.');
    }

    // 4. Validate group has >= 2 participants
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { groupId },
      orderBy: { seed: 'asc' },
    });

    if (participants.length < 2) {
      throw new Error('Bảng đấu phải có ít nhất 2 người chơi để tạo trận đấu');
    }

    // 5. Generate pairings using Round Robin algorithm
    const pairings = this.generateRoundRobinPairings(
      participants.map((p) => p.id),
      dto.matchupsPerPair || 1,
    );

    // 6. Create matches in transaction
    await this.prisma.$transaction(async (tx) => {
      for (const pairing of pairings) {
        const match = await tx.tournamentMatch.create({
          data: {
            tournamentId,
            groupId,
            stage: 'GROUP',
            round: pairing.round,
            matchNumber: pairing.matchNumber,
            status: MatchStatus.SCHEDULED,
          },
        });

        // Create match participants
        await tx.tournamentMatchParticipant.createMany({
          data: [
            {
              matchId: match.id,
              participantId: pairing.participant1Id,
              position: 1,
            },
            {
              matchId: match.id,
              participantId: pairing.participant2Id,
              position: 2,
            },
          ],
        });
      }

      // Update group status to IN_PROGRESS
      await tx.tournamentGroup.update({
        where: { id: groupId },
        data: { status: GroupStatus.IN_PROGRESS },
      });
    });

    // 7. Fetch and return created matches
    const matches = await this.prisma.tournamentMatch.findMany({
      where: { groupId },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
      include: {
        participants: {
          include: {
            participant: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return {
      groupId,
      matchesGenerated: matches.length,
      rounds: Math.max(...matches.map((m) => m.round)),
      matches: matches.map((m) => this.mapToMatchDto(m)),
    };
  }

  /**
   * Round Robin pairing algorithm (Circle Method)
   */
  private generateRoundRobinPairings(
    participantIds: string[],
    matchupsPerPair: number = 1,
  ): Pairing[] {
    const n = participantIds.length;

    if (n < 2) {
      throw new Error('Cần ít nhất 2 người tham gia');
    }

    const pairings: Pairing[] = [];
    const participants = [...participantIds];

    // Add dummy participant if odd number
    const isOdd = n % 2 === 1;
    if (isOdd) {
      participants.push('BYE');
    }

    const numParticipants = participants.length;
    const numRounds = numParticipants - 1;
    const matchesPerRound = numParticipants / 2;

    // Generate pairings for each matchup iteration
    for (let iteration = 0; iteration < matchupsPerPair; iteration++) {
      // Generate all rounds
      for (let round = 0; round < numRounds; round++) {
        // Generate matches for this round
        for (let match = 0; match < matchesPerRound; match++) {
          let home: number, away: number;

          if (match === 0) {
            // First match: player 0 vs last player
            home = 0;
            away = numParticipants - 1;
          } else {
            // Other matches: pair up remaining players
            home = match;
            away = numParticipants - 1 - match;
          }

          const p1 = participants[home];
          const p2 = participants[away];

          // Skip if bye
          if (p1 !== 'BYE' && p2 !== 'BYE') {
            pairings.push({
              participant1Id: p1,
              participant2Id: p2,
              round: iteration * numRounds + round + 1,
              matchNumber: match + 1,
            });
          }
        }

        // Rotate participants (keep first fixed)
        const fixed = participants[0];
        const rotated = participants.slice(1);
        rotated.push(rotated.shift()!);
        participants.splice(0, participants.length, fixed, ...rotated);
      }
    }

    return pairings;
  }

  // ============================================
  // Standings
  // ============================================

  /**
   * Get group standings with tie breaks applied
   */
  async getStandings(
    tournamentId: string,
    groupId: string,
    ctx: RequestContext,
  ): Promise<StandingsResponseDto> {
    // 1. Validate group exists
    const group = await this.prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        tournament: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                nickname: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        matches: {
          where: { status: 'COMPLETED' },
          include: {
            participants: {
              include: {
                participant: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error('Không tìm thấy bảng đấu');
    }

    if (group.tournamentId !== tournamentId) {
      throw new Error('Bảng đấu không thuộc giải đấu này');
    }

    // 2. Get tie break rules from tournament config
    const config = group.tournament.twoStagesConfig as unknown as TwoStagesConfig;
    const tieBreakRules = config?.groupStage?.tieBreaks || [];

    // 3. Calculate standings using TieBreakService
    const standings = this.tieBreakService.calculateStandings(
      group.participants,
      group.matches,
      tieBreakRules,
    );

    // 4. Mark advancing participants
    const standingsWithAdvancing = standings.map((s, index) => ({
      rank: index + 1,
      participant: this.mapToParticipantDto({
        ...group.participants.find((p) => p.id === s.id)!,
      }),
      matchRecord: s.matchRecord,
      gameRecord: s.gameRecord || { wins: 0, losses: 0, difference: 0 },
      pointsRecord: s.pointsRecord || { for: 0, against: 0, difference: 0 },
      tieBreakInfo: s.tieBreakInfo,
      isAdvancing: index + 1 <= group.participantsAdvancing,
    }));

    return {
      groupId: group.id,
      groupName: group.displayName,
      tieBreakRules,
      standings: standingsWithAdvancing,
    };
  }

  // ============================================
  // Auto-Generate Groups
  // ============================================

  /**
   * Automatically generate groups and assign participants based on seeding
   * Uses straight seeding: 1-4 to Group A, 5-8 to Group B, etc.
   */
  async autoGenerateGroups(
    tournamentId: string,
    dto: AutoGenerateGroupsDto,
    ctx: RequestContext,
  ): Promise<AutoGenerateGroupsResponseDto> {
    // 1. Validate admin role
    if (ctx.user.role !== 'ADMIN') {
      throw new Error('Chỉ quản trị viên mới có thể tự động tạo bảng đấu');
    }

    // 2. Validate tournament exists and is TWO_STAGES
    const tournament = await this.validateTournamentForGroups(tournamentId);

    // 3. Validate tournament status (DRAFT or PENDING only)
    if (
      tournament.status !== TournamentStatus.DRAFT &&
      tournament.status !== TournamentStatus.PENDING
    ) {
      throw new Error('Không thể tạo bảng đấu cho giải đấu đang diễn ra hoặc đã hoàn thành');
    }

    // 4. Validate participants are locked
    if (!tournament.participantsLocked) {
      throw new Error('Danh sách người tham gia phải được khóa trước khi tự động tạo bảng đấu');
    }

    // 5. Get all participants sorted by seed
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: {
        tournamentId,
        status: ParticipantStatus.CHECKED_IN,
        groupId: null, // Only participants not yet assigned to a group
      },
      orderBy: [
        { seed: 'asc' }, // Primary sort by seed
        { registeredAt: 'asc' }, // Secondary sort by registration time
      ],
      include: {
        user: true,
      },
    });

    if (participants.length === 0) {
      throw new Error('Không có người tham gia để phân vào bảng đấu');
    }

    // 6. Calculate group configuration
    const totalParticipants = participants.length;
    const config = tournament.twoStagesConfig as unknown as TwoStagesConfig;

    let numberOfGroups: number;
    let participantsPerGroup: number;

    // Validate input - must provide one or the other
    if (!dto.numberOfGroups && !dto.participantsPerGroup) {
      throw new Error('Phải cung cấp số lượng bảng đấu hoặc số người mỗi bảng');
    }

    if (dto.numberOfGroups && dto.participantsPerGroup) {
      throw new Error('Không thể cung cấp cả số lượng bảng đấu và số người mỗi bảng');
    }

    if (dto.numberOfGroups) {
      // Calculate participants per group
      numberOfGroups = dto.numberOfGroups;

      if (numberOfGroups < 2) {
        throw new Error('Số lượng bảng đấu phải ít nhất là 2');
      }

      if (numberOfGroups > totalParticipants) {
        throw new Error('Số lượng bảng đấu không được vượt quá số người tham gia');
      }

      participantsPerGroup = Math.ceil(totalParticipants / numberOfGroups);
    } else {
      // Calculate number of groups
      participantsPerGroup = dto.participantsPerGroup!;

      if (participantsPerGroup < 2 || participantsPerGroup > 20) {
        throw new Error('Participants per group must be between 2 and 20');
      }

      if (participantsPerGroup > totalParticipants) {
        throw new Error('Số người mỗi bảng không được vượt quá tổng số người tham gia');
      }

      numberOfGroups = Math.ceil(totalParticipants / participantsPerGroup);
    }

    // 7. Get participantsAdvancing from DTO or config
    const participantsAdvancing = dto.participantsAdvancing ?? config?.groupStage?.participantsAdvancing ?? 2;

    // Validate participantsAdvancing
    const minParticipantsInGroup = Math.floor(totalParticipants / numberOfGroups);
    if (participantsAdvancing >= minParticipantsInGroup) {
      throw new Error('Số người thăng hạng phải nhỏ hơn số người tối thiểu trong bảng');
    }

    // 8. Generate group names (A, B, C, D, ...)
    const groupNamePrefix = dto.groupNamePrefix || 'Group';
    const groupNames = this.generateGroupNames(numberOfGroups);

    // 9. Create groups and assign participants using transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const createdGroups: any[] = [];

      // Create all groups first
      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = groupNames[i];
        const group = await tx.tournamentGroup.create({
          data: {
            tournamentId,
            name: groupName,
            displayName: `${groupNamePrefix} ${groupName}`,
            participantsPerGroup: Math.ceil(totalParticipants / numberOfGroups),
            participantsAdvancing,
            status: GroupStatus.PENDING,
          },
        });
        createdGroups.push(group);
      }

      // Assign participants to groups using STRAIGHT seeding
      // Group A: 1-4, Group B: 5-8, Group C: 9-12, etc.
      const groupAssignments: Array<{
        id: string;
        name: string;
        displayName: string;
        participantCount: number;
        participantIds: string[];
        seeds: number[];
      }> = createdGroups.map((g) => ({
        id: g.id,
        name: g.name,
        displayName: g.displayName,
        participantCount: 0,
        participantIds: [],
        seeds: [],
      }));

      let currentGroupIndex = 0;
      let participantsInCurrentGroup = 0;
      const maxPerGroup = Math.ceil(totalParticipants / numberOfGroups);

      for (const participant of participants) {
        // Move to next group if current is full
        if (participantsInCurrentGroup >= maxPerGroup && currentGroupIndex < numberOfGroups - 1) {
          currentGroupIndex++;
          participantsInCurrentGroup = 0;
        }

        const groupId = createdGroups[currentGroupIndex].id;

        // Update participant with groupId
        await tx.tournamentParticipant.update({
          where: { id: participant.id },
          data: { groupId },
        });

        // Track assignment
        groupAssignments[currentGroupIndex].participantCount++;
        groupAssignments[currentGroupIndex].participantIds.push(participant.id);
        groupAssignments[currentGroupIndex].seeds.push(participant.seed || 0);
        participantsInCurrentGroup++;
      }

      return groupAssignments;
    });

    // 10. Return result
    return {
      groupsCreated: numberOfGroups,
      participantsAssigned: participants.length,
      groups: result,
    };
  }

  /**
   * Generate group names: A, B, C, ..., Z, AA, AB, ...
   */
  private generateGroupNames(count: number): string[] {
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i < 26) {
        // A-Z
        names.push(String.fromCharCode(65 + i));
      } else {
        // AA, AB, AC, ...
        const first = Math.floor(i / 26) - 1;
        const second = i % 26;
        names.push(String.fromCharCode(65 + first) + String.fromCharCode(65 + second));
      }
    }
    return names;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async validateTournamentForGroups(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament || tournament.deletedAt) {
      throw new Error('Tournament not found');
    }

    if (tournament.gameType !== 'TWO_STAGES') {
      throw new Error('Bảng đấu chỉ khả dụng cho giải đấu hai giai đoạn (TWO_STAGES)');
    }

    return tournament;
  }

  private mapToGroupDto(group: any, includeDetails: boolean = false): GroupResponseDto {
    const dto: GroupResponseDto = {
      id: group.id,
      tournamentId: group.tournamentId,
      name: group.name,
      displayName: group.displayName,
      participantsPerGroup: group.participantsPerGroup,
      participantsAdvancing: group.participantsAdvancing,
      status: group.status,
      participantCount: group._count?.participants || 0,
      matchCount: group._count?.matches || 0,
    };

    if (includeDetails) {
      if (group.participants) {
        dto.participants = group.participants.map((p: any) => this.mapToParticipantDto(p));
      }
      if (group.matches) {
        dto.matches = group.matches.map((m: any) => this.mapToMatchDto(m));
      }
    }

    return dto;
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
      user: participant.user
        ? {
            id: participant.user.id,
            email: participant.user.email,
            phone: participant.user.phone,
            fullName:
              participant.user.displayName ||
              `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim() ||
              participant.user.email,
            nickname: participant.user.nickname,
            displayName: participant.user.displayName,
            ratingPoints: participant.user.ratingPoints,
            totalMatches: participant.user.totalMatches,
            winRate: participant.user.winRate,
          }
        : undefined,
      group: participant.group
        ? {
            id: participant.group.id,
            name: participant.group.name,
          }
        : undefined,
    };
  }

  private mapToMatchDto(match: any): MatchResponseDto {
    return {
      id: match.id,
      tournamentId: match.tournamentId,
      groupId: match.groupId,
      stage: match.stage,
      round: match.round,
      matchNumber: match.matchNumber,
      status: match.status,
      matchDate: match.matchDate,
      courtNumber: match.courtNumber,
      winnerId: match.winnerId,
      finalScore: match.finalScore,
      gameScores: match.gameScores as any,
      participants: match.participants?.map((p: any) => ({
        id: p.id,
        participantId: p.participantId,
        position: p.position,
        isWinner: p.isWinner,
        score: p.score,
        participant: p.participant ? this.mapToParticipantDto(p.participant) : undefined,
      })) || [],
    };
  }

}
