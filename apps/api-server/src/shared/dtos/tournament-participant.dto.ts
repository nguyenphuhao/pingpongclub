import { z } from 'zod';

/**
 * Tournament Participant DTOs
 */

// ============================================
// CREATE PARTICIPANT
// ============================================

export const CreateTournamentParticipantDtoSchema = z.object({
  displayName: z.string().min(1, 'Tên participant là bắt buộc'),
  memberIds: z.array(z.string().min(1, 'User ID không hợp lệ')).optional(),
  seed: z.number().int().min(1, 'Seed không hợp lệ').optional(),
  status: z.string().min(1, 'Trạng thái không hợp lệ').optional(),
});

export type CreateTournamentParticipantDto = z.infer<typeof CreateTournamentParticipantDtoSchema>;

// ============================================
// UPDATE PARTICIPANT
// ============================================

export const UpdateTournamentParticipantDtoSchema = z.object({
  displayName: z.string().min(1, 'Tên participant là bắt buộc').optional(),
  memberIds: z.array(z.string().min(1, 'User ID không hợp lệ')).optional(),
  seed: z.number().int().min(1, 'Seed không hợp lệ').optional(),
  status: z.string().min(1, 'Trạng thái không hợp lệ').optional(),
});

export type UpdateTournamentParticipantDto = z.infer<typeof UpdateTournamentParticipantDtoSchema>;

// ============================================
// QUERY PARTICIPANTS
// ============================================

export const QueryTournamentParticipantsDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().nullish(),
  status: z.string().nullish(),
  orderBy: z.enum(['createdAt', 'displayName', 'seed']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryTournamentParticipantsDto = z.infer<typeof QueryTournamentParticipantsDtoSchema>;
