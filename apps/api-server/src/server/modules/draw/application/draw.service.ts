/**
 * Draw Service
 *
 * Business logic for draw sessions
 */

import {
  DrawSession,
  DrawStatus,
  DrawType,
  MatchStatus,
  Prisma,
  StageType,
  prisma,
} from '@pingclub/database';
import { DrawRepository } from '../infrastructure/draw.repository';
import { BadRequestException, NotFoundException } from '@/server/common/exceptions';
import { BracketService } from '@/server/modules/bracket/application/bracket.service';

export class DrawService {
  private repository: DrawRepository;
  private bracketService: BracketService;

  constructor() {
    this.repository = new DrawRepository();
    this.bracketService = new BracketService();
  }

  async getDraws(filters: { tournamentId?: string; stageId?: string; type?: DrawType }) {
    const where: Prisma.DrawSessionWhereInput = {};

    if (filters.tournamentId) {
      where.tournamentId = filters.tournamentId;
    }

    if (filters.stageId) {
      where.stageId = filters.stageId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return await this.repository.findMany(where);
  }

  async getDrawById(id: string): Promise<DrawSession> {
    const draw = await this.repository.findById(id);
    if (!draw) {
      throw new NotFoundException('Không tìm thấy phiên bốc thăm');
    }

    return draw;
  }

  async createDraw(data: {
    tournamentId: string;
    stageId?: string;
    type: DrawType;
    payload: Record<string, any>;
  }): Promise<DrawSession> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      select: { id: true },
    });
    if (!tournament) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }

    if (data.stageId) {
      const stage = await prisma.stage.findUnique({
        where: { id: data.stageId },
        select: { id: true, tournamentId: true },
      });
      if (!stage || stage.tournamentId !== data.tournamentId) {
        throw new BadRequestException('Stage không hợp lệ');
      }
    }

    return await this.repository.create({
      tournament: { connect: { id: data.tournamentId } },
      ...(data.stageId && { stage: { connect: { id: data.stageId } } }),
      type: data.type,
      status: DrawStatus.DRAFT,
      payload: data.payload,
      result: {},
    });
  }

  async updateDraw(
    id: string,
    data: { payload?: Record<string, any>; result?: Record<string, any>; status?: DrawStatus },
  ): Promise<DrawSession> {
    const draw = await this.repository.findById(id);
    if (!draw) {
      throw new NotFoundException('Không tìm thấy phiên bốc thăm');
    }

    return await this.repository.update(id, {
      ...(data.payload !== undefined && { payload: data.payload }),
      ...(data.result !== undefined && { result: data.result }),
      ...(data.status !== undefined && { status: data.status }),
    });
  }

  async applyDraw(id: string): Promise<void> {
    const draw = await this.repository.findById(id);
    if (!draw) {
      throw new NotFoundException('Không tìm thấy phiên bốc thăm');
    }

    if (draw.status === DrawStatus.APPLIED) {
      throw new BadRequestException('Phiên bốc thăm đã được áp dụng');
    }

    if (draw.type === DrawType.DOUBLES_PAIRING) {
      await this.applyDoublesPairing(draw);
    }

    if (draw.type === DrawType.GROUP_ASSIGNMENT) {
      await this.applyGroupAssignment(draw);
    }

    if (draw.type === DrawType.KNOCKOUT_PAIRING) {
      await this.applyKnockoutPairing(draw);
    }

    await this.repository.update(draw.id, { status: DrawStatus.APPLIED });
  }

  private async applyDoublesPairing(draw: DrawSession) {
    const pairs = Array.isArray((draw.result as any)?.pairs) ? (draw.result as any).pairs : [];

    if (pairs.length === 0) {
      throw new BadRequestException('Kết quả bốc thăm không hợp lệ');
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: draw.tournamentId },
      select: { id: true, matchFormat: true },
    });

    if (!tournament) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }

    if (tournament.matchFormat !== 'DOUBLES') {
      throw new BadRequestException('Giải đấu không phải đấu đôi');
    }

    await prisma.$transaction(async (tx) => {
      let order = 1;
      for (const pair of pairs) {
        const sideA = String(pair.sideA || '').trim();
        const sideB = String(pair.sideB || '').trim();

        if (!sideA || !sideB) {
          throw new BadRequestException('Pairing không hợp lệ');
        }

        const users = await tx.user.findMany({
          where: { id: { in: [sideA, sideB] } },
          select: { id: true, displayName: true, nickname: true },
        });

        if (users.length !== 2) {
          throw new BadRequestException('User không tồn tại');
        }

        const userA = users.find(u => u.id === sideA);
        const userB = users.find(u => u.id === sideB);

        const nameA = userA?.displayName || userA?.nickname || 'VĐV 1';
        const nameB = userB?.displayName || userB?.nickname || 'VĐV 2';
        const teamDisplayName = `${nameA} - ${nameB}`;

        const existingMembers = await tx.tournamentParticipantMember.findMany({
          where: {
            userId: { in: [sideA, sideB] },
            tournamentParticipant: { tournamentId: draw.tournamentId },
          },
        });

        if (existingMembers.length > 0) {
          // Delete old participants for these users to allow forming new team
          const participantIds = existingMembers.map(m => m.tournamentParticipantId);
          await tx.tournamentParticipant.deleteMany({
            where: { id: { in: participantIds } },
          });
        }

        const participant = await tx.tournamentParticipant.create({
          data: {
            displayName: teamDisplayName,
            status: 'active',
            tournament: { connect: { id: draw.tournamentId } },
            members: {
              create: [
                { user: { connect: { id: sideA } } },
                { user: { connect: { id: sideB } } },
              ],
            },
          },
        });

        await tx.drawPairing.create({
          data: {
            drawSession: { connect: { id: draw.id } },
            sideAId: sideA,
            sideBId: sideB,
            order,
          },
        });

        order += 1;
      }
    });
  }

  private async applyGroupAssignment(draw: DrawSession) {
    const assignments = Array.isArray((draw.result as any)?.assignments)
      ? (draw.result as any).assignments
      : [];

    if (assignments.length === 0) {
      throw new BadRequestException('Kết quả bốc thăm không hợp lệ');
    }

    await prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        const groupId = String(assignment.groupId || '').trim();
        const participantId = String(assignment.participantId || '').trim();

        if (!groupId || !participantId) {
          throw new BadRequestException('Assignment không hợp lệ');
        }

        const group = await tx.group.findUnique({
          where: { id: groupId },
          include: {
            stage: { select: { tournamentId: true } },
          },
        });

        if (!group || group.stage.tournamentId !== draw.tournamentId) {
          throw new BadRequestException('Group không hợp lệ');
        }

        const participant = await tx.tournamentParticipant.findUnique({
          where: { id: participantId },
          select: { id: true, tournamentId: true },
        });

        if (!participant || participant.tournamentId !== draw.tournamentId) {
          throw new BadRequestException('Participant không hợp lệ');
        }

        const existingInTournament = await tx.groupMember.findFirst({
          where: {
            tournamentParticipantId: participantId,
            group: { stage: { tournamentId: draw.tournamentId } },
          },
        });

        if (existingInTournament) {
          throw new BadRequestException('Participant đã thuộc group khác trong giải đấu');
        }

        await tx.groupMember.create({
          data: {
            group: { connect: { id: groupId } },
            tournamentParticipant: { connect: { id: participantId } },
            seedInGroup: assignment.seedInGroup ?? null,
            status: 'active',
          },
        });

        await tx.drawGroupAssignment.create({
          data: {
            drawSession: { connect: { id: draw.id } },
            group: { connect: { id: groupId } },
            tournamentParticipantId: participantId,
            seedInGroup: assignment.seedInGroup ?? null,
          },
        });
      }
    });
  }

  private async applyKnockoutPairing(draw: DrawSession) {
    const result = (draw.result as any) || {};
    const mode = result.mode || 'CUSTOM';

    const stageId = draw.stageId;
    if (!stageId) {
      throw new BadRequestException('Stage ID là bắt buộc');
    }

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: { id: true, type: true, tournamentId: true },
    });

    if (!stage || stage.type !== StageType.KNOCKOUT) {
      throw new BadRequestException('Stage không hợp lệ');
    }

    // Handle RANDOM mode
    if (mode === 'RANDOM') {
      await this.bracketService.generateBracket(stage.id, {
        sourceType: 'RANDOM',
        size: Number(result.size),
        bestOf: Number(result.bestOf) || 1,
        seedOrder: 'STANDARD',
      });
      await this.bracketService.resolveBracket(stage.id);
      return;
    }

    // Handle GROUP_RANK mode
    if (mode === 'GROUP_RANK') {
      await this.bracketService.generateBracket(stage.id, {
        sourceType: 'GROUP_RANK',
        sourceStageId: result.sourceStageId,
        topNPerGroup: Number(result.topNPerGroup),
        wildcardCount: Number(result.wildcardCount) || 0,
        size: Number(result.size),
        bestOf: 1, // Default or add to input if needed
      });
      await this.bracketService.resolveBracket(stage.id);
      return;
    }

    // Handle CUSTOM mode (Manual)
    const order = Array.isArray(result.order) ? result.order : [];
    const pairs = Array.isArray(result.pairs) ? result.pairs : [];

    if (order.length === 0 && pairs.length === 0) {
      throw new BadRequestException('Kết quả bốc thăm không hợp lệ');
    }

    const flattened = order.length > 0
      ? order
      : pairs.flatMap((pair: any) => [pair.sideA, pair.sideB]);

    if (flattened.length % 2 !== 0) {
      throw new BadRequestException('Danh sách pairing không hợp lệ');
    }

    const uniqueIds = Array.from(new Set(flattened.map((id: any) => String(id).trim()))).filter(Boolean);
    if (uniqueIds.length !== flattened.length) {
      throw new BadRequestException('Danh sách participant bị trùng');
    }

    const participants = await prisma.tournamentParticipant.findMany({
      where: { id: { in: uniqueIds }, tournamentId: stage.tournamentId },
      select: { id: true },
    });

    if (participants.length !== uniqueIds.length) {
      throw new BadRequestException('Participant không hợp lệ');
    }

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < flattened.length; index += 1) {
        await tx.tournamentParticipant.update({
          where: { id: String(flattened[index]) },
          data: { seed: index + 1 },
        });
      }

      // Record pairing in draw_pairing table specifically for traceability
      await tx.drawPairing.createMany({
        data: flattened.reduce<any[]>((acc, id, index) => {
          if (index % 2 === 0) {
            acc.push({
              drawSessionId: draw.id,
              sideAId: String(id),
              sideBId: String(flattened[index + 1]),
              order: (index / 2) + 1,
            });
          }
          return acc;
        }, []),
        skipDuplicates: true,
      });
    });

    const pairsForGenerate = pairs.length > 0
      ? pairs
      : flattened.reduce<Array<{ sideA: string; sideB: string }>>((acc, id, index) => {
        if (index % 2 === 0) {
          acc.push({ sideA: String(id), sideB: String(flattened[index + 1]) });
        }
        return acc;
      }, []);

    await this.bracketService.generateBracket(stage.id, {
      sourceType: 'CUSTOM',
      pairs: pairsForGenerate,
      seedOrder: 'STANDARD',
      bestOf: 1,
    });

    await this.bracketService.resolveBracket(stage.id);

    await prisma.match.updateMany({
      where: { stageId: stage.id },
      data: { status: MatchStatus.SCHEDULED },
    });
  }
}
