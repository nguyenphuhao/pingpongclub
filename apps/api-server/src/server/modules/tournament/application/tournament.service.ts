/**
 * Tournament Service
 *
 * Business logic for tournament operations
 */

import { MatchFormat, Prisma, Tournament } from '@pingclub/database';
import { TournamentRepository } from '../infrastructure/tournament.repository';
import { GetTournamentsQuery, PaginatedResponse } from '../domain/tournament.types';
import { BadRequestException, NotFoundException } from '@/server/common/exceptions';

export class TournamentService {
  private repository: TournamentRepository;

  constructor() {
    this.repository = new TournamentRepository();
  }

  async getTournaments(query: GetTournamentsQuery): Promise<PaginatedResponse<Tournament>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const tournaments = await this.repository.findTournaments({
      ...query,
      page,
      limit,
    });
    const total = await this.repository.countTournaments(query);

    return {
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTournamentById(id: string): Promise<Tournament> {
    const tournament = await this.repository.findById(id);
    if (!tournament) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }

    return tournament;
  }

  async createTournament(data: {
    name: string;
    description?: string | null;
    matchFormat: MatchFormat;
  }): Promise<Tournament> {
    const name = data.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên giải đấu là bắt buộc');
    }

    const createData: Prisma.TournamentCreateInput = {
      name,
      description: data.description ?? null,
      matchFormat: data.matchFormat,
    };

    return await this.repository.create(createData);
  }

  async updateTournament(
    id: string,
    data: { name?: string; description?: string | null; matchFormat?: MatchFormat },
  ): Promise<Tournament> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }

    const updateData: Prisma.TournamentUpdateInput = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('Tên giải đấu là bắt buộc');
      }
      updateData.name = name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.matchFormat !== undefined) {
      updateData.matchFormat = data.matchFormat;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    return await this.repository.update(id, updateData);
  }

  async deleteTournament(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }

    await this.repository.delete(id);
  }
}
