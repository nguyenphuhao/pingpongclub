/**
 * Tournament Participant Repository
 *
 * Handles database operations for tournament participants
 */

import { prisma, Prisma, TournamentParticipant } from '@pingclub/database';
import { GetTournamentParticipantsQuery } from '../domain/tournament-participant.types';

export class TournamentParticipantRepository {
  async findByTournament(
    tournamentId: string,
    query: GetTournamentParticipantsQuery,
  ): Promise<TournamentParticipant[]> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      orderBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: Prisma.TournamentParticipantWhereInput = {
      tournamentId,
    };

    if (status) {
      where.status = status;
    }

    if (search && search.length >= 2) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByInput: Prisma.TournamentParticipantOrderByWithRelationInput = {};
    if (orderBy === 'displayName') {
      orderByInput.displayName = order;
    } else if (orderBy === 'seed') {
      orderByInput.seed = order;
    } else {
      orderByInput.createdAt = order;
    }

    return await prisma.tournamentParticipant.findMany({
      where,
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByInput,
    });
  }

  async countByTournament(
    tournamentId: string,
    query: GetTournamentParticipantsQuery,
  ): Promise<number> {
    const { search, status } = query;

    const where: Prisma.TournamentParticipantWhereInput = {
      tournamentId,
    };

    if (status) {
      where.status = status;
    }

    if (search && search.length >= 2) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.tournamentParticipant.count({ where });
  }

  async findById(id: string): Promise<TournamentParticipant | null> {
    return await prisma.tournamentParticipant.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByTournamentAndDisplayName(
    tournamentId: string,
    displayName: string,
  ): Promise<TournamentParticipant | null> {
    return await prisma.tournamentParticipant.findFirst({
      where: { tournamentId, displayName },
    });
  }

  async findByTournamentAndUserId(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentParticipant | null> {
    return await prisma.tournamentParticipant.findFirst({
      where: {
        tournamentId,
        members: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async create(data: Prisma.TournamentParticipantCreateInput): Promise<TournamentParticipant> {
    return await prisma.tournamentParticipant.create({
      data,
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.TournamentParticipantUpdateInput,
  ): Promise<TournamentParticipant> {
    return await prisma.tournamentParticipant.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<TournamentParticipant> {
    return await prisma.tournamentParticipant.delete({
      where: { id },
    });
  }
}
