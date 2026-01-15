import { z } from 'zod';

/**
 * Group & Group Member DTOs
 */

// ============================================
// GROUPS
// ============================================

export const CreateGroupDtoSchema = z.object({
  name: z.string().min(1, 'Tên group là bắt buộc'),
  groupOrder: z.number().int().min(1, 'Thứ tự group không hợp lệ').optional(),
});

export type CreateGroupDto = z.infer<typeof CreateGroupDtoSchema>;

export const UpdateGroupDtoSchema = z.object({
  name: z.string().min(1, 'Tên group là bắt buộc').optional(),
  groupOrder: z.number().int().min(1, 'Thứ tự group không hợp lệ').optional(),
});

export type UpdateGroupDto = z.infer<typeof UpdateGroupDtoSchema>;

export const QueryGroupsDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  orderBy: z.enum(['groupOrder', 'createdAt', 'name']).optional().default('groupOrder'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type QueryGroupsDto = z.infer<typeof QueryGroupsDtoSchema>;

// ============================================
// GROUP MEMBERS
// ============================================

export const CreateGroupMemberDtoSchema = z.object({
  tournamentParticipantId: z.string().min(1, 'Participant ID là bắt buộc'),
  seedInGroup: z.number().int().min(1, 'Seed trong group không hợp lệ').optional(),
  status: z.string().min(1, 'Trạng thái không hợp lệ').optional(),
});

export type CreateGroupMemberDto = z.infer<typeof CreateGroupMemberDtoSchema>;

export const UpdateGroupMemberDtoSchema = z.object({
  seedInGroup: z.number().int().min(1, 'Seed trong group không hợp lệ').optional(),
  status: z.string().min(1, 'Trạng thái không hợp lệ').optional(),
});

export type UpdateGroupMemberDto = z.infer<typeof UpdateGroupMemberDtoSchema>;

export const QueryGroupMembersDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().nullish(),
  status: z.string().nullish(),
  orderBy: z.enum(['createdAt', 'seedInGroup']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryGroupMembersDto = z.infer<typeof QueryGroupMembersDtoSchema>;
