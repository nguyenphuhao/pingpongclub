/**
 * Tournament Participant Service
 *
 * Business logic for tournament participant operations
 */

import { MatchFormat, prisma, Prisma, TournamentParticipant } from '@pingclub/database';
import { TournamentParticipantRepository } from '../infrastructure/tournament-participant.repository';
import { GetTournamentParticipantsQuery, PaginatedResponse } from '../domain/tournament-participant.types';
import { BadRequestException, NotFoundException } from '@/server/common/exceptions';

export class TournamentParticipantService {
  private repository: TournamentParticipantRepository;

  constructor() {
    this.repository = new TournamentParticipantRepository();
  }

  async getParticipantsByTournament(
    tournamentId: string,
    query: GetTournamentParticipantsQuery,
  ): Promise<PaginatedResponse<TournamentParticipant>> {
    await this.ensureTournamentExists(tournamentId);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const participants = await this.repository.findByTournament(tournamentId, {
      ...query,
      page,
      limit,
    });
    const total = await this.repository.countByTournament(tournamentId, query);

    return {
      data: participants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getParticipantById(id: string): Promise<TournamentParticipant> {
    const participant = await this.repository.findById(id);
    if (!participant) {
      throw new NotFoundException('Không tìm thấy participant');
    }

    return participant;
  }

  async createParticipant(
    tournamentId: string,
    data: { displayName: string; memberIds?: string[]; seed?: number; status?: string },
  ): Promise<TournamentParticipant> {
    const tournament = await this.ensureTournamentExists(tournamentId);

    const displayName = data.displayName?.trim();
    if (!displayName) {
      throw new BadRequestException('Tên participant là bắt buộc');
    }

    const existing = await this.repository.findByTournamentAndDisplayName(
      tournamentId,
      displayName,
    );
    if (existing) {
      throw new BadRequestException('Tên participant đã tồn tại trong giải đấu');
    }

    if (data.seed !== undefined && (!Number.isInteger(data.seed) || data.seed < 1)) {
      throw new BadRequestException('Seed không hợp lệ');
    }

    const memberIds = (data.memberIds || []).map((memberId) => memberId.trim()).filter(Boolean);
    if (tournament.matchFormat === 'DOUBLES') {
      if (memberIds.length === 0) {
        throw new BadRequestException('Danh sách thành viên không được để trống');
      }
      if (memberIds.length > 2) {
        throw new BadRequestException('Mỗi đội tối đa 2 thành viên');
      }
    }

    if (memberIds.length > 0) {
      const uniqueMemberIds = Array.from(new Set(memberIds));
      if (uniqueMemberIds.length !== memberIds.length) {
        throw new BadRequestException('Danh sách thành viên bị trùng');
      }

      const users = await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true },
      });

      if (users.length !== memberIds.length) {
        throw new NotFoundException('Không tìm thấy user');
      }

      const existingByUser = await prisma.tournamentParticipantMember.findFirst({
        where: {
          userId: { in: memberIds },
          tournamentParticipant: {
            tournamentId,
          },
        },
      });

      if (existingByUser) {
        throw new BadRequestException('User đã tồn tại trong giải đấu');
      }
    } else if (tournament.matchFormat === 'DOUBLES') {
      throw new BadRequestException('Giải đôi yêu cầu danh sách thành viên');
    }

    const createData: Prisma.TournamentParticipantCreateInput = {
      displayName,
      seed: data.seed ?? null,
      status: data.status ?? 'active',
      tournament: {
        connect: { id: tournamentId },
      },
      ...(memberIds.length > 0 && {
        members: {
          create: memberIds.map((userId) => ({
            user: { connect: { id: userId } },
          })),
        },
      }),
    };

    return await this.repository.create(createData);
  }

  async updateParticipant(
    id: string,
    data: { displayName?: string; memberIds?: string[]; seed?: number; status?: string },
  ): Promise<TournamentParticipant> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy participant');
    }

    const updateData: Prisma.TournamentParticipantUpdateInput = {};

    if (data.displayName !== undefined) {
      const displayName = data.displayName.trim();
      if (!displayName) {
        throw new BadRequestException('Tên participant là bắt buộc');
      }

      const duplicate = await this.repository.findByTournamentAndDisplayName(
        existing.tournamentId,
        displayName,
      );
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Tên participant đã tồn tại trong giải đấu');
      }

      updateData.displayName = displayName;
    }

    const memberIds = data.memberIds?.map((memberId) => memberId.trim()).filter(Boolean);
    if (memberIds !== undefined) {
      const tournament = await this.ensureTournamentExists(existing.tournamentId);
      if (tournament.matchFormat === 'DOUBLES') {
        if (memberIds.length === 0) {
          throw new BadRequestException('Danh sách thành viên không được để trống');
        }
        if (memberIds.length > 2) {
          throw new BadRequestException('Mỗi đội tối đa 2 thành viên');
        }
      }

      const uniqueMemberIds = Array.from(new Set(memberIds));
      if (uniqueMemberIds.length !== memberIds.length) {
        throw new BadRequestException('Danh sách thành viên bị trùng');
      }

      if (memberIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: memberIds } },
          select: { id: true },
        });

        if (users.length !== memberIds.length) {
          throw new NotFoundException('Không tìm thấy user');
        }

        const existingByUser = await prisma.tournamentParticipantMember.findFirst({
          where: {
            userId: { in: memberIds },
            tournamentParticipant: {
              tournamentId: existing.tournamentId,
            },
            tournamentParticipantId: {
              not: existing.id,
            },
          },
        });

        if (existingByUser) {
          throw new BadRequestException('User đã tồn tại trong giải đấu');
        }
      }
    }

    if (data.seed !== undefined) {
      if (!Number.isInteger(data.seed) || data.seed < 1) {
        throw new BadRequestException('Seed không hợp lệ');
      }
      updateData.seed = data.seed;
    }

    if (data.status !== undefined) {
      const status = data.status.trim();
      if (!status) {
        throw new BadRequestException('Trạng thái không hợp lệ');
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0 && memberIds === undefined) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    if (memberIds !== undefined) {
      return await prisma.$transaction(async (tx) => {
        await tx.tournamentParticipantMember.deleteMany({
          where: { tournamentParticipantId: id },
        });

        if (memberIds.length > 0) {
          await tx.tournamentParticipantMember.createMany({
            data: memberIds.map((userId) => ({
              tournamentParticipantId: id,
              userId,
            })),
          });
        }

        return await tx.tournamentParticipant.update({
          where: { id },
          data: updateData,
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        });
      });
    }

    return await this.repository.update(id, updateData);
  }

  async seedParticipantsByElo(tournamentId: string): Promise<void> {
    await this.ensureTournamentExists(tournamentId);

    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        members: { include: { user: true } },
        user: true,
      },
    });

    if (participants.length === 0) {
      throw new BadRequestException('Giải đấu chưa có participant');
    }

    const missingMembers = participants.filter(
      (participant) => participant.members.length === 0 && !participant.userId,
    );
    if (missingMembers.length > 0) {
      throw new BadRequestException('Tất cả participant phải có thành viên để seed theo elo');
    }

    const sorted = [...participants].sort((a, b) => {
      const ratingA = this.calculateTeamRating(a.members, a.user?.ratingPoints);
      const ratingB = this.calculateTeamRating(b.members, b.user?.ratingPoints);
      return ratingB - ratingA;
    });

    await prisma.$transaction(
      sorted.map((participant, index) =>
        prisma.tournamentParticipant.update({
          where: { id: participant.id },
          data: { seed: index + 1 },
        }),
      ),
    );
  }

  async deleteParticipant(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy participant');
    }

    await this.repository.delete(id);
  }

  private async ensureTournamentExists(
    tournamentId: string,
  ): Promise<{ id: string; matchFormat: MatchFormat }> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, matchFormat: true },
    });

    if (!tournament) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }

    return tournament;
  }

  private calculateTeamRating(
    members: Array<{ user: { ratingPoints: number } | null }>,
    fallbackRating?: number,
  ): number {
    if (members.length === 0) {
      return fallbackRating ?? 0;
    }

    const total = members.reduce((sum, member) => sum + (member.user?.ratingPoints ?? 0), 0);
    return total / members.length;
  }
}
