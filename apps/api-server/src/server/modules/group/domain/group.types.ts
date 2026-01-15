import { Group, GroupMember } from '@pingclub/database';

export interface GetGroupsQuery {
  page?: number;
  limit?: number;
  orderBy?: 'groupOrder' | 'createdAt' | 'name';
  order?: 'asc' | 'desc';
}

export interface GetGroupMembersQuery {
  page?: number;
  limit?: number;
  search?: string | null;
  status?: string | null;
  orderBy?: 'createdAt' | 'seedInGroup';
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type GroupEntity = Group;
export type GroupMemberEntity = GroupMember;
