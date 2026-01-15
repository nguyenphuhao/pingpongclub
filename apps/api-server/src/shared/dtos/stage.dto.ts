import { z } from 'zod';
import { StageType, H2hMode } from '@pingclub/database';

/**
 * Stage & StageRule DTOs
 */

// ============================================
// STAGES
// ============================================

export const CreateStageDtoSchema = z.object({
  name: z.string().min(1, 'Tên stage là bắt buộc'),
  type: z.nativeEnum(StageType),
  stageOrder: z.number().int().min(1, 'Thứ tự stage không hợp lệ'),
});

export type CreateStageDto = z.infer<typeof CreateStageDtoSchema>;

export const UpdateStageDtoSchema = z.object({
  name: z.string().min(1, 'Tên stage là bắt buộc').optional(),
  type: z.nativeEnum(StageType).optional(),
  stageOrder: z.number().int().min(1, 'Thứ tự stage không hợp lệ').optional(),
});

export type UpdateStageDto = z.infer<typeof UpdateStageDtoSchema>;

export const QueryStagesDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  orderBy: z.enum(['stageOrder', 'createdAt', 'name']).optional().default('stageOrder'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type QueryStagesDto = z.infer<typeof QueryStagesDtoSchema>;

// ============================================
// STAGE RULES
// ============================================

export const CreateStageRuleDtoSchema = z.object({
  winPoints: z.number().int().min(0, 'Điểm thắng không hợp lệ').optional(),
  lossPoints: z.number().int().min(0, 'Điểm thua không hợp lệ').optional(),
  byePoints: z.number().int().min(0, 'Điểm bye không hợp lệ').optional(),
  countByeGamesPoints: z.boolean().optional(),
  countWalkoverAsPlayed: z.boolean().optional(),
  tieBreakOrder: z.array(z.string()).min(1, 'Tie-break order là bắt buộc'),
  h2hMode: z.nativeEnum(H2hMode),
});

export type CreateStageRuleDto = z.infer<typeof CreateStageRuleDtoSchema>;

export const UpdateStageRuleDtoSchema = z.object({
  winPoints: z.number().int().min(0, 'Điểm thắng không hợp lệ').optional(),
  lossPoints: z.number().int().min(0, 'Điểm thua không hợp lệ').optional(),
  byePoints: z.number().int().min(0, 'Điểm bye không hợp lệ').optional(),
  countByeGamesPoints: z.boolean().optional(),
  countWalkoverAsPlayed: z.boolean().optional(),
  tieBreakOrder: z.array(z.string()).min(1, 'Tie-break order là bắt buộc').optional(),
  h2hMode: z.nativeEnum(H2hMode).optional(),
});

export type UpdateStageRuleDto = z.infer<typeof UpdateStageRuleDtoSchema>;
