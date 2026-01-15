/**
 * Stage Rule Preset Service
 *
 * Business logic for stage rule preset operations
 */

import { Prisma, StageRulePreset, H2hMode, QualifyMode } from '@pingclub/database';
import { StageRulePresetRepository } from '../infrastructure/stage-rule-preset.repository';
import { GetStageRulePresetsQuery, PaginatedResponse } from '../domain/stage-rule-preset.types';
import { BadRequestException, NotFoundException } from '@/server/common/exceptions';

export class StageRulePresetService {
  private repository: StageRulePresetRepository;

  constructor() {
    this.repository = new StageRulePresetRepository();
  }

  async getPresets(
    query: GetStageRulePresetsQuery,
  ): Promise<PaginatedResponse<StageRulePreset>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const presets = await this.repository.findPresets({
      ...query,
      page,
      limit,
    });
    const total = await this.repository.countPresets(query);

    return {
      data: presets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPresetById(id: string): Promise<StageRulePreset> {
    const preset = await this.repository.findById(id);
    if (!preset) {
      throw new NotFoundException('Không tìm thấy preset');
    }

    return preset;
  }

  async createPreset(data: {
    code: string;
    name: string;
    description?: string | null;
    winPoints?: number;
    lossPoints?: number;
    byePoints?: number;
    countByeGamesPoints?: boolean;
    countWalkoverAsPlayed?: boolean;
    tieBreakOrder: string[];
    h2hMode: H2hMode;
    qualifyMode: QualifyMode;
    topNPerGroup?: number | null;
    topNOverall?: number | null;
    wildcardCount?: number;
    isActive?: boolean;
  }): Promise<StageRulePreset> {
    const code = data.code.trim();
    const name = data.name.trim();

    if (!code) {
      throw new BadRequestException('Mã preset là bắt buộc');
    }

    if (!name) {
      throw new BadRequestException('Tên preset là bắt buộc');
    }

    const existingByCode = await this.repository.findByCode(code);
    if (existingByCode) {
      throw new BadRequestException('Mã preset đã tồn tại');
    }

    const createData: Prisma.StageRulePresetCreateInput = {
      code,
      name,
      description: data.description ?? null,
      winPoints: data.winPoints ?? 1,
      lossPoints: data.lossPoints ?? 0,
      byePoints: data.byePoints ?? 1,
      countByeGamesPoints: data.countByeGamesPoints ?? false,
      countWalkoverAsPlayed: data.countWalkoverAsPlayed ?? true,
      tieBreakOrder: data.tieBreakOrder,
      h2hMode: data.h2hMode,
      qualifyMode: data.qualifyMode,
      topNPerGroup: data.topNPerGroup ?? null,
      topNOverall: data.topNOverall ?? null,
      wildcardCount: data.wildcardCount ?? 0,
      isActive: data.isActive ?? true,
    };

    return await this.repository.create(createData);
  }

  async updatePreset(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string | null;
      winPoints?: number;
      lossPoints?: number;
      byePoints?: number;
      countByeGamesPoints?: boolean;
      countWalkoverAsPlayed?: boolean;
      tieBreakOrder?: string[];
      h2hMode?: H2hMode;
      qualifyMode?: QualifyMode;
      topNPerGroup?: number | null;
      topNOverall?: number | null;
      wildcardCount?: number;
      isActive?: boolean;
    },
  ): Promise<StageRulePreset> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy preset');
    }

    const updateData: Prisma.StageRulePresetUpdateInput = {};

    if (data.code !== undefined) {
      const code = data.code.trim();
      if (!code) {
        throw new BadRequestException('Mã preset là bắt buộc');
      }
      const existingByCode = await this.repository.findByCode(code);
      if (existingByCode && existingByCode.id !== id) {
        throw new BadRequestException('Mã preset đã tồn tại');
      }
      updateData.code = code;
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('Tên preset là bắt buộc');
      }
      updateData.name = name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

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

    if (data.qualifyMode !== undefined) {
      updateData.qualifyMode = data.qualifyMode;
    }

    if (data.topNPerGroup !== undefined) {
      updateData.topNPerGroup = data.topNPerGroup;
    }

    if (data.topNOverall !== undefined) {
      updateData.topNOverall = data.topNOverall;
    }

    if (data.wildcardCount !== undefined) {
      updateData.wildcardCount = data.wildcardCount;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    return await this.repository.update(id, updateData);
  }

  async deletePreset(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy preset');
    }

    await this.repository.delete(id);
  }
}
