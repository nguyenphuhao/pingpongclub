/**
 * Tournament Repository
 *
 * Handles database operations for tournaments
 */

import { prisma, Prisma, Tournament } from '@pingclub/database';
import { GetTournamentsQuery } from '../domain/tournament.types';

export class TournamentRepository {
  async findTournaments(query: GetTournamentsQuery): Promise<Tournament[]> {
    const {
      page = 1,
      limit = 20,
      search,
      orderBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: Prisma.TournamentWhereInput = {};

    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByInput: Prisma.TournamentOrderByWithRelationInput = {};
    if (orderBy === 'name') {
      orderByInput.name = order;
    } else {
      orderByInput.createdAt = order;
    }

    return await prisma.tournament.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByInput,
    });
  }

  async countTournaments(query: GetTournamentsQuery): Promise<number> {
    const { search } = query;

    const where: Prisma.TournamentWhereInput = {};

    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.tournament.count({ where });
  }

  async findById(id: string): Promise<Tournament | null> {
    return await prisma.tournament.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.TournamentCreateInput): Promise<Tournament> {
    return await prisma.tournament.create({
      data,
    });
  }

  async update(id: string, data: Prisma.TournamentUpdateInput): Promise<Tournament> {
    return await prisma.tournament.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Tournament> {
    return await prisma.tournament.delete({
      where: { id },
    });
  }
}
