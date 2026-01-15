import { z } from 'zod';
import { MatchFormat } from '@pingclub/database';

/**
 * Tournament DTOs
 */

// ============================================
// CREATE TOURNAMENT
// ============================================

export const CreateTournamentDtoSchema = z.object({
  name: z.string().min(1, 'Tên giải đấu là bắt buộc'),
  description: z.string().optional().nullable(),
  matchFormat: z.nativeEnum(MatchFormat),
});

export type CreateTournamentDto = z.infer<typeof CreateTournamentDtoSchema>;

// ============================================
// UPDATE TOURNAMENT
// ============================================

export const UpdateTournamentDtoSchema = z.object({
  name: z.string().min(1, 'Tên giải đấu là bắt buộc').optional(),
  description: z.string().optional().nullable(),
  matchFormat: z.nativeEnum(MatchFormat).optional(),
});

export type UpdateTournamentDto = z.infer<typeof UpdateTournamentDtoSchema>;

// ============================================
// QUERY TOURNAMENTS
// ============================================

export const QueryTournamentsDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().nullish(),
  orderBy: z.enum(['createdAt', 'name']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryTournamentsDto = z.infer<typeof QueryTournamentsDtoSchema>;
