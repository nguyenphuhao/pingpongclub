/**
 * Stage Service
 *
 * Business logic for stage and stage rule operations
 */

import { prisma, Prisma, Stage, StageRule, StageType, H2hMode } from '@pingclub/database';
import { StageRepository } from '../infrastructure/stage.repository';
import { GetStagesQuery, PaginatedResponse } from '../domain/stage.types';
import {
  BadRequestException,
  NotFoundException,
} from '@/server/common/exceptions';

export class StageService {
  private repository: StageRepository;

  constructor() {
    this.repository = new StageRepository();
  }

  async getStagesByTournament(
    tournamentId: string,
    query: GetStagesQuery,
  ): Promise<PaginatedResponse<Stage>> {
    await this.ensureTournamentExists(tournamentId);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const stages = await this.repository.findStagesByTournament(tournamentId, {
      ...query,
      page,
      limit,
    });
    const total = await this.repository.countStagesByTournament(tournamentId);

    return {
      data: stages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStageById(id: string): Promise<Stage> {
    const stage = await this.repository.findById(id);
    if (!stage) {
      throw new NotFoundException('Không tìm thấy stage');
    }

    return stage;
  }

  async createStage(
    tournamentId: string,
    data: { name: string; type: StageType; stageOrder: number },
  ): Promise<Stage> {
    await this.ensureTournamentExists(tournamentId);

    const name = data.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên stage là bắt buộc');
    }

    if (!Number.isInteger(data.stageOrder) || data.stageOrder < 1) {
      throw new BadRequestException('Thứ tự stage không hợp lệ');
    }

    const createData: Prisma.StageCreateInput = {
      name,
      type: data.type,
      stageOrder: data.stageOrder,
      tournament: {
        connect: { id: tournamentId },
      },
    };

    return await this.repository.create(createData);
  }

  async updateStage(
    id: string,
    data: { name?: string; type?: StageType; stageOrder?: number },
  ): Promise<Stage> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy stage');
    }

    const updateData: Prisma.StageUpdateInput = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('Tên stage là bắt buộc');
      }
      updateData.name = name;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.stageOrder !== undefined) {
      if (!Number.isInteger(data.stageOrder) || data.stageOrder < 1) {
        throw new BadRequestException('Thứ tự stage không hợp lệ');
      }
      updateData.stageOrder = data.stageOrder;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    return await this.repository.update(id, updateData);
  }

  async deleteStage(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy stage');
    }

    await this.repository.delete(id);
  }

  async getStageRule(stageId: string): Promise<StageRule> {
    await this.ensureStageExists(stageId);

    const rule = await this.repository.findStageRuleByStageId(stageId);
    if (!rule) {
      throw new NotFoundException('Không tìm thấy stage rule');
    }

    return rule;
  }

  async createStageRule(
    stageId: string,
    data: {
      winPoints?: number;
      lossPoints?: number;
      byePoints?: number;
      countByeGamesPoints?: boolean;
      countWalkoverAsPlayed?: boolean;
      tieBreakOrder: string[];
      h2hMode: H2hMode;
    },
  ): Promise<StageRule> {
    await this.ensureStageExists(stageId);

    const existingRule = await this.repository.findStageRuleByStageId(stageId);
    if (existingRule) {
      throw new BadRequestException('Stage rule đã tồn tại');
    }

    const createData: Prisma.StageRuleCreateInput = {
      winPoints: data.winPoints ?? 1,
      lossPoints: data.lossPoints ?? 0,
      byePoints: data.byePoints ?? 1,
      countByeGamesPoints: data.countByeGamesPoints ?? false,
      countWalkoverAsPlayed: data.countWalkoverAsPlayed ?? true,
      tieBreakOrder: data.tieBreakOrder,
      h2hMode: data.h2hMode,
      stage: {
        connect: { id: stageId },
      },
    };

    return await this.repository.createStageRule(createData);
  }

  async updateStageRule(
    stageId: string,
    data: {
      winPoints?: number;
      lossPoints?: number;
      byePoints?: number;
      countByeGamesPoints?: boolean;
      countWalkoverAsPlayed?: boolean;
      tieBreakOrder?: string[];
      h2hMode?: H2hMode;
    },
  ): Promise<StageRule> {
    await this.ensureStageExists(stageId);

    const existing = await this.repository.findStageRuleByStageId(stageId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy stage rule');
    }

    const updateData: Prisma.StageRuleUpdateInput = {};

    if (data.winPoints !== undefined) {
      updateData.winPoints = data.winPoints;
    }

    if (data.lossPoints !== undefined) {
      updateData.lossPoints = data.lossPoints;
    }

    if (data.byePoints !== undefined) {
      updateData.byePoints = data.byePoints;
    }

    if (data.countByeGamesPoints !== undefined) {
      updateData.countByeGamesPoints = data.countByeGamesPoints;
    }

    if (data.countWalkoverAsPlayed !== undefined) {
      updateData.countWalkoverAsPlayed = data.countWalkoverAsPlayed;
    }

    if (data.tieBreakOrder !== undefined) {
      updateData.tieBreakOrder = data.tieBreakOrder;
    }

    if (data.h2hMode !== undefined) {
      updateData.h2hMode = data.h2hMode;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    return await this.repository.updateStageRule(stageId, updateData);
  }

  async deleteStageRule(stageId: string): Promise<void> {
    await this.ensureStageExists(stageId);

    const existing = await this.repository.findStageRuleByStageId(stageId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy stage rule');
    }

    await this.repository.deleteStageRule(stageId);
  }

  private async ensureTournamentExists(tournamentId: string): Promise<void> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      throw new NotFoundException('Không tìm thấy giải đấu');
    }
  }

  private async ensureStageExists(stageId: string): Promise<void> {
    const stage = await this.repository.findById(stageId);
    if (!stage) {
      throw new NotFoundException('Không tìm thấy stage');
    }
  }
}
