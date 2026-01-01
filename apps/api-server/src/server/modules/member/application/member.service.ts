/**
 * Member Service
 * 
 * Shared business logic for member operations
 * Used by both admin portal and mobile app with permission-based filtering
 */

import { 
  User, 
  UserStatus, 
  PlayerRank, 
  calculateRank, 
  calculateYearsPlaying, 
  calculateWinRate,
  getRankInfo,
  Prisma,
} from '@pingclub/database';
import { MemberRepository } from '../infrastructure/member.repository';
import { MemberPermissions } from '../domain/member.permissions';
import {
  RequestContext,
  MemberPublicDto,
  MemberAdminDto,
  GetMembersQuery,
  PaginatedResponse,
  MemberStatistics,
  MemberWithStats,
} from '../domain/member.types';

export class MemberService {
  private repository: MemberRepository;

  constructor() {
    this.repository = new MemberRepository();
  }

  /**
   * ⭐ SHARED METHOD - Get members with permission-based filtering
   */
  async getMembers(
    query: GetMembersQuery,
    ctx: RequestContext
  ): Promise<PaginatedResponse<MemberPublicDto | MemberAdminDto>> {
    // Build query based on permissions
    const enhancedQuery = { ...query };
    
    // Non-admins only see active members by default
    if (!MemberPermissions.canViewAllMembers(ctx)) {
      enhancedQuery.status = 'ACTIVE' as UserStatus;
    }

    const members = await this.repository.findMembers(enhancedQuery);
    const total = await this.repository.countMembers(enhancedQuery);

    // Transform based on permissions
    const data = members.map(member =>
      this.transformMemberByPermission(member, ctx)
    );

    return {
      data,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * ⭐ SHARED METHOD - Get single member with permission check
   */
  async getMemberById(
    memberId: string,
    ctx: RequestContext
  ): Promise<MemberWithStats> {
    // Check permission
    if (!MemberPermissions.canViewMember({ ...ctx, targetUserId: memberId })) {
      throw new Error('You do not have permission to view this member');
    }

    const member = await this.repository.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Calculate rank
    const yearsPlaying = calculateYearsPlaying(member.startedPlayingAt);
    const currentRank = calculateRank(member.ratingPoints, yearsPlaying);
    const rankInfo = getRankInfo(currentRank);

    // Get additional data based on permissions
    const canViewSensitive = MemberPermissions.canViewSensitiveFields({
      ...ctx,
      targetUserId: memberId,
    });

    const ratingHistory = canViewSensitive
      ? await this.repository.getRatingHistory(memberId, { limit: 20 })
      : [];

    const recentMatches = await this.repository.getRecentMatches(memberId, {
      limit: 10,
    });

    return {
      ...this.transformMemberByPermission(member, {
        ...ctx,
        targetUserId: memberId,
      }),
      currentRank,
      rankInfo,
      yearsPlaying,
      ratingHistory,
      recentMatches,
    } as MemberWithStats;
  }

  /**
   * ⭐ SHARED METHOD - Update member
   */
  async updateMember(
    memberId: string,
    updates: Partial<User>,
    ctx: RequestContext
  ): Promise<MemberPublicDto | MemberAdminDto> {
    // Check permission
    if (!MemberPermissions.canEditMember({ ...ctx, targetUserId: memberId })) {
      throw new Error('You do not have permission to edit this member');
    }

    // Filter allowed fields
    const filteredUpdates = MemberPermissions.filterAllowedFields(updates, {
      ...ctx,
      targetUserId: memberId,
    });

    // Calculate win rate if wins/matches changed
    if ('totalWins' in filteredUpdates || 'totalMatches' in filteredUpdates) {
      const member = await this.repository.findById(memberId);
      if (member) {
        const wins = (filteredUpdates.totalWins as number) ?? member.totalWins;
        const matches = (filteredUpdates.totalMatches as number) ?? member.totalMatches;
        (filteredUpdates as any).winRate = calculateWinRate(wins, matches);
      }
    }

    const updatedMember = await this.repository.update(
      memberId,
      filteredUpdates as Prisma.UserUpdateInput
    );

    return this.transformMemberByPermission(updatedMember, {
      ...ctx,
      targetUserId: memberId,
    });
  }

  /**
   * ⭐ SHARED METHOD - Create new member
   */
  async createMember(
    data: Partial<User>,
    ctx: RequestContext
  ): Promise<MemberAdminDto> {
    // Check permission
    if (!MemberPermissions.canCreateMember(ctx)) {
      throw new Error('You do not have permission to create members');
    }

    // Validate required fields
    if (!data.email) {
      throw new Error('Email is required');
    }

    // Check if email already exists
    const existingMember = await this.repository.findByEmail(data.email);
    if (existingMember) {
      throw new Error('Email already exists');
    }

    // Create member with defaults
    const memberData: Prisma.UserCreateInput = {
      email: data.email,
      nickname: data.nickname || null,
      displayName: data.displayName || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      phone: data.phone || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth || null,
      ratingPoints: data.ratingPoints || 1000,
      initialRating: data.ratingPoints || 1000,
      peakRating: data.ratingPoints || 1000,
      startedPlayingAt: data.startedPlayingAt || new Date(),
      tags: data.tags || [],
      playStyle: data.playStyle || null,
      bio: data.bio || null,
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: false,
    };

    const newMember = await this.repository.create(memberData);

    return this.transformMemberByPermission(newMember, {
      ...ctx,
      targetUserId: newMember.id,
    }) as MemberAdminDto;
  }

  /**
   * ⭐ SHARED METHOD - Get leaderboard
   */
  async getLeaderboard(
    options: { rank?: PlayerRank; limit?: number },
    ctx: RequestContext
  ) {
    const members = await this.repository.getTopPlayers({
      ...options,
      limit: options.limit || 50,
    });

    return members.map((member, index) => {
      const yearsPlaying = calculateYearsPlaying(member.startedPlayingAt);
      const currentRank = calculateRank(member.ratingPoints, yearsPlaying);

      return {
        position: index + 1,
        member: this.transformMemberByPermission(member, ctx),
        currentRank,
        ratingPoints: member.ratingPoints,
      };
    });
  }

  /**
   * ⭐ ADMIN ONLY - Delete member
   */
  async deleteMember(memberId: string, ctx: RequestContext): Promise<void> {
    if (!MemberPermissions.canDeleteMember(ctx)) {
      throw new Error('Only admins can delete members');
    }

    await this.repository.softDelete(memberId);
  }

  /**
   * ⭐ ADMIN ONLY - Get statistics
   */
  async getStatistics(ctx: RequestContext): Promise<MemberStatistics> {
    if (!MemberPermissions.canViewAllMembers(ctx)) {
      throw new Error('Only admins can view statistics');
    }

    const stats = await this.repository.getStatistics();
    
    // Get all active members to calculate rank distribution
    const members = await this.repository.findMembers({
      status: 'ACTIVE' as UserStatus,
      limit: 10000, // Get all
    });

    // Calculate rank distribution
    const rankCounts: Record<PlayerRank, number> = {
      A_STAR: 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
      G: 0,
      H: 0,
      UNRANKED: 0,
    };

    members.forEach(member => {
      const yearsPlaying = calculateYearsPlaying(member.startedPlayingAt);
      const rank = calculateRank(member.ratingPoints, yearsPlaying);
      rankCounts[rank]++;
    });

    const rankDistribution = Object.entries(rankCounts).map(([rank, count]) => ({
      rank: rank as PlayerRank,
      count,
      percentage: stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0,
    }));

    // Get gender distribution
    const genderDist = await this.repository.getGenderDistribution();
    const genderDistribution = genderDist.map(item => ({
      gender: item.gender || 'UNKNOWN',
      count: item._count.gender,
    }));

    return {
      ...stats,
      rankDistribution,
      genderDistribution,
    };
  }

  /**
   * ⭐ ADMIN ONLY - Bulk update members
   */
  async bulkUpdateMembers(
    memberIds: string[],
    updates: Partial<User>,
    ctx: RequestContext
  ): Promise<number> {
    if (!MemberPermissions.canViewAllMembers(ctx)) {
      throw new Error('Only admins can perform bulk operations');
    }

    const result = await this.repository.bulkUpdate(
      memberIds,
      updates as Prisma.UserUpdateInput
    );

    return result.count;
  }

  /**
   * Transform member data based on viewer permissions
   * @private
   */
  private transformMemberByPermission(
    member: User,
    ctx: RequestContext & { targetUserId?: string }
  ): MemberPublicDto | MemberAdminDto {
    const canViewSensitive = MemberPermissions.canViewSensitiveFields(ctx);

    // Calculate years playing for display
    const yearsPlaying = calculateYearsPlaying(member.startedPlayingAt);

    // Base public data
    const publicData: MemberPublicDto = {
      id: member.id,
      nickname: member.nickname,
      displayName: member.displayName,
      avatar: member.avatar,
      ratingPoints: member.showRating ? member.ratingPoints : null,
      totalMatches: member.totalMatches,
      winRate: member.winRate,
      tags: member.tags,
      status: member.status,
    };

    // Add sensitive data if allowed
    if (canViewSensitive) {
      return {
        ...publicData,
        email: member.email,
        phone: member.showPhone ? member.phone : null,
        firstName: member.firstName,
        lastName: member.lastName,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth,
        peakRating: member.peakRating,
        totalWins: member.totalWins,
        totalLosses: member.totalLosses,
        currentStreak: member.currentStreak,
        yearsPlaying,
        startedPlayingAt: member.startedPlayingAt,
        playStyle: member.playStyle,
        bio: member.bio,
        adminNotes: MemberPermissions.canViewAdminNotes(ctx) ? member.adminNotes : null,
        profileVisibility: member.profileVisibility,
        showPhone: member.showPhone,
        showEmail: member.showEmail,
        showRating: member.showRating,
        createdAt: member.createdAt,
        lastLoginAt: member.lastLoginAt,
      } as MemberAdminDto;
    }

    return publicData;
  }
}

