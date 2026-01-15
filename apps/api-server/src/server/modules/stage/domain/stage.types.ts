import { Stage, StageRule } from '@pingclub/database';

export interface GetStagesQuery {
  page?: number;
  limit?: number;
  orderBy?: 'stageOrder' | 'createdAt' | 'name';
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

export type StageEntity = Stage;
export type StageRuleEntity = StageRule;
