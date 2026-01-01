/**
 * Member Domain Types
 */

import { User, UserRole, UserStatus, PlayerRank, Gender, ProfileVisibility } from '@pingclub/database';

export interface RequestContext {
  user: {
    id: string;
    role: UserRole;
  };
  targetUserId?: string;
}

export interface MemberPublicDto {
  id: string;
  nickname: string | null;
  displayName: string | null;
  avatar: string | null;
  ratingPoints: number | null; // Null if showRating is false
  totalMatches: number;
  winRate: number | null;
  tags: string[];
  status: UserStatus;
  // Sensitive fields NOT included
}

export interface MemberAdminDto extends MemberPublicDto {
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: Gender | null;
  dateOfBirth: Date | null;
  peakRating: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  yearsPlaying: number | null;
  startedPlayingAt: Date | null;
  playStyle: string | null;
  bio: string | null;
  adminNotes: string | null;
  profileVisibility: ProfileVisibility;
  showPhone: boolean;
  showEmail: boolean;
  showRating: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface GetMembersQuery {
  page?: number;
  limit?: number;
  search?: string;
  rank?: PlayerRank;
  status?: UserStatus;
  gender?: Gender;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'name' | 'rating' | 'winRate' | 'totalMatches' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MemberWithStats extends User {
  currentRank?: PlayerRank;
  rankInfo?: {
    label: string;
    minPoints: number;
    maxPoints: number | null;
  };
  yearsPlaying?: number | null;
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

export interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  averageRating: number;
  rankDistribution: Array<{
    rank: PlayerRank;
    count: number;
    percentage: number;
  }>;
  genderDistribution: Array<{
    gender: Gender | 'UNKNOWN';
    count: number;
  }>;
}

