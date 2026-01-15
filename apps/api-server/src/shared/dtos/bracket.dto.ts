import { z } from 'zod';

/**
 * Bracket DTOs
 */

export const GenerateBracketDtoSchema = z.object({
  sourceType: z.enum(['CUSTOM', 'RANDOM', 'GROUP_RANK']),
  sourceStageId: z.string().optional(),
  size: z.number().int().min(2).optional(),
  seedOrder: z.enum(['STANDARD', 'REVERSE']).optional(),
  topNPerGroup: z.number().int().min(1).optional(),
  wildcardCount: z.number().int().min(0).optional(),
  bestOf: z.number().int().min(1).optional(),
  pairs: z
    .array(
      z.object({
        sideA: z.string().min(1, 'Participant ID là bắt buộc'),
        sideB: z.string().min(1, 'Participant ID là bắt buộc'),
      }),
    )
    .optional(),
});

export type GenerateBracketDto = z.infer<typeof GenerateBracketDtoSchema>;
