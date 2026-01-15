import { StageRulePreset } from '@pingclub/database';

export interface GetStageRulePresetsQuery {
  page?: number;
  limit?: number;
  search?: string | null;
  isActive?: boolean;
  orderBy?: 'createdAt' | 'name';
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

export type StageRulePresetEntity = StageRulePreset;
