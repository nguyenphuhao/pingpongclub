/**
 * Stage Repository
 *
 * Handles database operations for stages and stage rules
 */

import { prisma, Prisma, Stage, StageRule } from '@pingclub/database';
import { GetStagesQuery } from '../domain/stage.types';

export class StageRepository {
  async findStagesByTournament(
    tournamentId: string,
    query: GetStagesQuery,
  ): Promise<Stage[]> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'stageOrder',
      order = 'asc',
    } = query;

    const orderByInput: Prisma.StageOrderByWithRelationInput = {};
    if (orderBy === 'name') {
      orderByInput.name = order;
    } else if (orderBy === 'createdAt') {
      orderByInput.createdAt = order;
    } else {
      orderByInput.stageOrder = order;
    }

    return await prisma.stage.findMany({
      where: { tournamentId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByInput,
    });
  }

  async countStagesByTournament(tournamentId: string): Promise<number> {
    return await prisma.stage.count({ where: { tournamentId } });
  }

  async findById(id: string): Promise<Stage | null> {
    return await prisma.stage.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.StageCreateInput): Promise<Stage> {
    return await prisma.stage.create({ data });
  }

  async update(id: string, data: Prisma.StageUpdateInput): Promise<Stage> {
    return await prisma.stage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Stage> {
    return await prisma.stage.delete({
      where: { id },
    });
  }

  async findStageRuleByStageId(stageId: string): Promise<StageRule | null> {
    return await prisma.stageRule.findUnique({
      where: { stageId },
    });
  }

  async createStageRule(data: Prisma.StageRuleCreateInput): Promise<StageRule> {
    return await prisma.stageRule.create({ data });
  }

  async updateStageRule(stageId: string, data: Prisma.StageRuleUpdateInput): Promise<StageRule> {
    return await prisma.stageRule.update({
      where: { stageId },
      data,
    });
  }

  async deleteStageRule(stageId: string): Promise<StageRule> {
    return await prisma.stageRule.delete({
      where: { stageId },
    });
  }
}
