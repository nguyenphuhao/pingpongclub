import { z } from 'zod';
import { DrawStatus, DrawType } from '@pingclub/database';

/**
 * Draw DTOs
 */

export const CreateDrawDtoSchema = z.object({
  tournamentId: z.string().min(1, 'Tournament ID là bắt buộc'),
  stageId: z.string().optional(),
  type: z.nativeEnum(DrawType),
  payload: z.record(z.any()),
});

export type CreateDrawDto = z.infer<typeof CreateDrawDtoSchema>;

export const UpdateDrawDtoSchema = z.object({
  payload: z.record(z.any()).optional(),
  result: z.record(z.any()).optional(),
  status: z.nativeEnum(DrawStatus).optional(),
});

export type UpdateDrawDto = z.infer<typeof UpdateDrawDtoSchema>;

export const QueryDrawsDtoSchema = z.object({
  tournamentId: z.string().optional(),
  stageId: z.string().optional(),
  type: z.nativeEnum(DrawType).optional(),
});

export type QueryDrawsDto = z.infer<typeof QueryDrawsDtoSchema>;
