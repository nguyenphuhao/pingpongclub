/**
 * Stage Rule Preset Repository
 *
 * Handles database operations for stage rule presets
 */

import { prisma, Prisma, StageRulePreset } from '@pingclub/database';
import { GetStageRulePresetsQuery } from '../domain/stage-rule-preset.types';

export class StageRulePresetRepository {
  async findPresets(query: GetStageRulePresetsQuery): Promise<StageRulePreset[]> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      orderBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: Prisma.StageRulePresetWhereInput = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search && search.length >= 2) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByInput: Prisma.StageRulePresetOrderByWithRelationInput = {};
    if (orderBy === 'name') {
      orderByInput.name = order;
    } else {
      orderByInput.createdAt = order;
    }

    return await prisma.stageRulePreset.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByInput,
    });
  }

  async countPresets(query: GetStageRulePresetsQuery): Promise<number> {
    const { search, isActive } = query;

    const where: Prisma.StageRulePresetWhereInput = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search && search.length >= 2) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.stageRulePreset.count({ where });
  }

  async findById(id: string): Promise<StageRulePreset | null> {
    return await prisma.stageRulePreset.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<StageRulePreset | null> {
    return await prisma.stageRulePreset.findUnique({
      where: { code },
    });
  }

  async create(data: Prisma.StageRulePresetCreateInput): Promise<StageRulePreset> {
    return await prisma.stageRulePreset.create({ data });
  }

  async update(
    id: string,
    data: Prisma.StageRulePresetUpdateInput,
  ): Promise<StageRulePreset> {
    return await prisma.stageRulePreset.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<StageRulePreset> {
    return await prisma.stageRulePreset.delete({
      where: { id },
    });
  }
}
