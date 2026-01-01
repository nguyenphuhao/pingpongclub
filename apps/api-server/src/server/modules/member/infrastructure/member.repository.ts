/**
 * Member Repository
 * 
 * Handles database operations for members
 */

import { prisma, User, UserStatus, PlayerRank, Gender, Prisma } from '@pingclub/database';
import { GetMembersQuery } from '../domain/member.types';

export class MemberRepository {
  /**
   * Find members with filters, pagination, and sorting
   */
  async findMembers(query: GetMembersQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      rank,
      status,
      gender,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null, // Exclude soft-deleted users
      role: 'USER', // Only regular users, not admins
    };

    // Status filter
    if (status) {
      where.status = status;
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Rank filter (converts rank to rating range)
    if (rank) {
      const ratingRange = this.getRatingRangeForRank(rank);
      where.ratingPoints = {
        gte: ratingRange.min,
        ...(ratingRange.max !== null && { lte: ratingRange.max }),
      };
    } else if (minRating !== undefined || maxRating !== undefined) {
      // Only use minRating/maxRating if rank is not specified
      where.ratingPoints = {};
      if (minRating !== undefined) {
        where.ratingPoints.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.ratingPoints.lte = maxRating;
      }
    }

    // Search filter (name, nickname, email, phone)
    if (search && search.length >= 2) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Sorting
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.displayName = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.ratingPoints = sortOrder;
    } else if (sortBy === 'winRate') {
      orderBy.winRate = sortOrder;
    } else if (sortBy === 'totalMatches') {
      orderBy.totalMatches = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const members = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    });

    return members;
  }

  /**
   * Count members matching the query
   */
  async countMembers(query: GetMembersQuery): Promise<number> {
    const {
      search,
      rank,
      status,
      gender,
      minRating,
      maxRating,
    } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: 'USER',
    };

    if (status) {
      where.status = status;
    }

    if (gender) {
      where.gender = gender;
    }

    // Rank filter (converts rank to rating range)
    if (rank) {
      const ratingRange = this.getRatingRangeForRank(rank);
      where.ratingPoints = {
        gte: ratingRange.min,
        ...(ratingRange.max !== null && { lte: ratingRange.max }),
      };
    } else if (minRating !== undefined || maxRating !== undefined) {
      // Only use minRating/maxRating if rank is not specified
      where.ratingPoints = {};
      if (minRating !== undefined) {
        where.ratingPoints.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.ratingPoints.lte = maxRating;
      }
    }

    if (search && search.length >= 2) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.user.count({ where });
  }

  /**
   * Find member by ID
   */
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Find member by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  /**
   * Create new member
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data: {
        ...data,
        role: 'USER', // Ensure it's a regular user
      },
    });
  }

  /**
   * Update member
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete member
   */
  async softDelete(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });
  }

  /**
   * Get rating history for a member
   */
  async getRatingHistory(userId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 20, offset = 0 } = options;

    return await prisma.ratingHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get recent matches for a member
   */
  async getRecentMatches(userId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 10, offset = 0 } = options;

    return await prisma.matchParticipant.findMany({
      where: { userId },
      include: {
        match: true,
      },
      orderBy: { match: { matchDate: 'desc' } },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get top players by rating
   */
  async getTopPlayers(options: { rank?: PlayerRank; limit?: number } = {}) {
    const { limit = 50 } = options;

    return await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: 'USER',
        status: 'ACTIVE',
      },
      orderBy: {
        ratingPoints: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get member statistics
   */
  async getStatistics(filters: { startDate?: Date; endDate?: Date } = {}) {
    const baseWhere: Prisma.UserWhereInput = {
      deletedAt: null,
      role: 'USER',
    };

    // Total members
    const totalMembers = await prisma.user.count({
      where: baseWhere,
    });

    // Active members
    const activeMembers = await prisma.user.count({
      where: { ...baseWhere, status: 'ACTIVE' },
    });

    // New members this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newMembersThisMonth = await prisma.user.count({
      where: {
        ...baseWhere,
        createdAt: { gte: startOfMonth },
      },
    });

    // Average rating
    const ratingStats = await prisma.user.aggregate({
      where: { ...baseWhere, status: 'ACTIVE' },
      _avg: { ratingPoints: true },
    });

    return {
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      averageRating: ratingStats._avg.ratingPoints || 1000,
    };
  }

  /**
   * Get rank distribution
   */
  async getRankDistribution(): Promise<Record<string, number>> {
    // We'll calculate ranks in the service layer
    // This method returns rating distribution that can be used to calculate ranks
    const members = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: 'USER',
        status: 'ACTIVE',
      },
      select: {
        ratingPoints: true,
        yearsPlaying: true,
      },
    });

    return members.reduce((acc, member) => {
      const rating = member.ratingPoints;
      acc[rating.toString()] = (acc[rating.toString()] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get gender distribution
   */
  async getGenderDistribution() {
    const distribution = await prisma.user.groupBy({
      by: ['gender'],
      where: {
        deletedAt: null,
        role: 'USER',
        status: 'ACTIVE',
      },
      _count: { gender: true },
    });

    return distribution;
  }

  /**
   * Bulk update members
   */
  async bulkUpdate(memberIds: string[], data: Prisma.UserUpdateInput) {
    return await prisma.user.updateMany({
      where: {
        id: { in: memberIds },
      },
      data,
    });
  }

  /**
   * Helper: Convert PlayerRank to rating points range
   * Based on the ranking system:
   * - A*: 2201+
   * - A: 2001-2200
   * - B: 1801-2000
   * - C: 1601-1800
   * - D: 1401-1600
   * - E: 1201-1400
   * - F: 1001-1200
   * - G: 801-1000
   * - H: 0-800
   */
  private getRatingRangeForRank(rank: PlayerRank): { min: number; max: number | null } {
    const ranges: Record<PlayerRank, { min: number; max: number | null }> = {
      A_STAR: { min: 2201, max: null },
      A: { min: 2001, max: 2200 },
      B: { min: 1801, max: 2000 },
      C: { min: 1601, max: 1800 },
      D: { min: 1401, max: 1600 },
      E: { min: 1201, max: 1400 },
      F: { min: 1001, max: 1200 },
      G: { min: 801, max: 1000 },
      H: { min: 0, max: 800 },
      UNRANKED: { min: 0, max: null }, // Fallback for unranked
    };
    return ranges[rank] || { min: 0, max: null };
  }
}

