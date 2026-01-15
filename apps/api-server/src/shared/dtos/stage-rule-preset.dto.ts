import { z } from 'zod';
import { H2hMode, QualifyMode } from '@pingclub/database';

/**
 * Stage Rule Preset DTOs
 */

// ============================================
// CREATE PRESET
// ============================================

export const CreateStageRulePresetDtoSchema = z.object({
  code: z.string().min(1, 'Mã preset là bắt buộc'),
  name: z.string().min(1, 'Tên preset là bắt buộc'),
  description: z.string().optional().nullable(),
  winPoints: z.number().int().min(0, 'Điểm thắng không hợp lệ').optional(),
  lossPoints: z.number().int().min(0, 'Điểm thua không hợp lệ').optional(),
  byePoints: z.number().int().min(0, 'Điểm bye không hợp lệ').optional(),
  countByeGamesPoints: z.boolean().optional(),
  countWalkoverAsPlayed: z.boolean().optional(),
  tieBreakOrder: z.array(z.string()).min(1, 'Tie-break order là bắt buộc'),
  h2hMode: z.nativeEnum(H2hMode),
  qualifyMode: z.nativeEnum(QualifyMode),
  topNPerGroup: z.number().int().min(1, 'Top N per group không hợp lệ').optional().nullable(),
  topNOverall: z.number().int().min(1, 'Top N overall không hợp lệ').optional().nullable(),
  wildcardCount: z.number().int().min(0, 'Số wildcard không hợp lệ').optional(),
  isActive: z.boolean().optional(),
});

export type CreateStageRulePresetDto = z.infer<typeof CreateStageRulePresetDtoSchema>;

// ============================================
// UPDATE PRESET
// ============================================

export const UpdateStageRulePresetDtoSchema = z.object({
  code: z.string().min(1, 'Mã preset là bắt buộc').optional(),
  name: z.string().min(1, 'Tên preset là bắt buộc').optional(),
  description: z.string().optional().nullable(),
  winPoints: z.number().int().min(0, 'Điểm thắng không hợp lệ').optional(),
  lossPoints: z.number().int().min(0, 'Điểm thua không hợp lệ').optional(),
  byePoints: z.number().int().min(0, 'Điểm bye không hợp lệ').optional(),
  countByeGamesPoints: z.boolean().optional(),
  countWalkoverAsPlayed: z.boolean().optional(),
  tieBreakOrder: z.array(z.string()).min(1, 'Tie-break order là bắt buộc').optional(),
  h2hMode: z.nativeEnum(H2hMode).optional(),
  qualifyMode: z.nativeEnum(QualifyMode).optional(),
  topNPerGroup: z.number().int().min(1, 'Top N per group không hợp lệ').optional().nullable(),
  topNOverall: z.number().int().min(1, 'Top N overall không hợp lệ').optional().nullable(),
  wildcardCount: z.number().int().min(0, 'Số wildcard không hợp lệ').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateStageRulePresetDto = z.infer<typeof UpdateStageRulePresetDtoSchema>;

// ============================================
// QUERY PRESETS
// ============================================

export const QueryStageRulePresetsDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().nullish(),
  isActive: z.coerce.boolean().optional(),
  orderBy: z.enum(['createdAt', 'name']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryStageRulePresetsDto = z.infer<typeof QueryStageRulePresetsDtoSchema>;
