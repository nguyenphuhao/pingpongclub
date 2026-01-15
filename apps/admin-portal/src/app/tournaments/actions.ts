'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  matchFormat?: 'SINGLE' | 'DOUBLES';
}

export interface Stage {
  id: string;
  tournamentId: string;
  name: string;
  type: 'GROUP' | 'KNOCKOUT' | 'LEAGUE' | 'SWISS' | string;
  stageOrder: number;
  createdAt: string;
}

export interface StageRule {
  winPoints: number;
  lossPoints: number;
  byePoints: number;
  countByeGamesPoints: boolean;
  countWalkoverAsPlayed: boolean;
  tieBreakOrder: string[];
  h2hMode: 'TWO_WAY_ONLY' | 'MINI_TABLE' | string;
}

export interface StageRulePreset extends StageRule {
  id: string;
  name: string;
  description: string | null;
  createdAt?: string;
}

export interface Participant {
  id: string;
  tournamentId: string;
  displayName: string;
  seed: number | null;
  status: string;
  createdAt: string;
  members?: Array<{
    userId: string;
    user: {
      id: string;
      displayName: string | null;
      nickname: string | null;
      phone: string | null;
      ratingPoints: number;
    };
  }>;
}

export interface Group {
  id: string;
  stageId: string;
  name: string;
  groupOrder: number;
}

export interface GroupMember {
  groupId: string;
  tournamentParticipantId: string;
  seedInGroup: number | null;
  status: string;
}

export interface BracketMatchSide {
  side: 'A' | 'B';
  participants: Array<{ id: string; displayName: string }>;
}

export interface BracketMatch {
  id: string;
  roundNo: number;
  matchNo: number;
  status: string;
  sides: BracketMatchSide[];
}

export interface BracketSlot {
  id: string;
  targetMatchId: string;
  targetSide: 'A' | 'B';
  sourceType: string;
  sourceGroupId: string | null;
  sourceRank: number | null;
  sourceSeed: number | null;
  sourceMatchId: string | null;
  resolved: boolean;
  participant: { id: string; displayName: string } | null;
}

export interface StageBracket {
  matches: BracketMatch[];
  slots: BracketSlot[];
}

export interface MemberOption {
  id: string;
  displayName: string | null;
  nickname: string | null;
  phone: string | null;
  ratingPoints: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetTournamentsParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: 'createdAt' | 'name';
  order?: 'asc' | 'desc';
}

export interface GetStagesParams {
  page?: number;
  limit?: number;
  orderBy?: 'stageOrder' | 'createdAt' | 'name';
  order?: 'asc' | 'desc';
}

export interface GetParticipantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderBy?: 'createdAt' | 'displayName' | 'seed';
  order?: 'asc' | 'desc';
}

export interface GetGroupsParams {
  page?: number;
  limit?: number;
  orderBy?: 'groupOrder' | 'createdAt' | 'name';
  order?: 'asc' | 'desc';
}

export interface GetGroupMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderBy?: 'createdAt' | 'seedInGroup';
  order?: 'asc' | 'desc';
}

export interface GetMemberOptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function getAdminToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    return token?.value || null;
  } catch (error) {
    console.error('Error reading admin token:', error);
    return null;
  }
}

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = await getAdminToken();

  if (!token) {
    throw new Error('Unauthorized - No admin token found');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function authenticatedFetchAllowNotFound(url: string, options: RequestInit = {}) {
  const token = await getAdminToken();

  if (!token) {
    throw new Error('Unauthorized - No admin token found');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getTournaments(params: GetTournamentsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.orderBy) queryParams.set('orderBy', params.orderBy);
  if (params.order) queryParams.set('order', params.order);

  const response = await authenticatedFetch(`/api/admin/tournaments?${queryParams.toString()}`);

  return {
    data: (response?.data || []) as Tournament[],
    pagination: (response?.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: 0,
      totalPages: 0,
    }) as PaginationMeta,
  };
}

export async function getTournamentById(id: string) {
  const response = await authenticatedFetch(`/api/admin/tournaments/${id}`);
  return response?.data as Tournament;
}

export async function createTournament(data: { name: string; description?: string; matchFormat: 'SINGLE' | 'DOUBLES' }) {
  const response = await authenticatedFetch(`/api/admin/tournaments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  return response?.data as Tournament;
}

export async function updateTournament(id: string, data: { name: string; description?: string }) {
  const response = await authenticatedFetch(`/api/admin/tournaments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  revalidatePath(`/tournaments/${id}`);
  return response?.data as Tournament;
}

export async function deleteTournament(id: string) {
  const response = await authenticatedFetch(`/api/admin/tournaments/${id}`, {
    method: 'DELETE',
  });

  revalidatePath('/tournaments');
  return response?.data;
}

export async function getStages(tournamentId: string, params: GetStagesParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.orderBy) queryParams.set('orderBy', params.orderBy);
  if (params.order) queryParams.set('order', params.order);

  const response = await authenticatedFetch(
    `/api/admin/tournaments/${tournamentId}/stages?${queryParams.toString()}`,
  );

  return {
    data: (response?.data || []) as Stage[],
    pagination: (response?.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: 0,
      totalPages: 0,
    }) as PaginationMeta,
  };
}

export async function createStage(
  tournamentId: string,
  data: { name: string; type: string; stageOrder: number },
) {
  const response = await authenticatedFetch(`/api/admin/tournaments/${tournamentId}/stages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data as Stage;
}

export async function updateStage(
  tournamentId: string,
  stageId: string,
  data: { name: string; type: string; stageOrder: number },
) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data as Stage;
}

export async function deleteStage(tournamentId: string, stageId: string) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}`, {
    method: 'DELETE',
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data;
}

export async function getStageRules(stageId: string) {
  const response = await authenticatedFetchAllowNotFound(`/api/admin/stages/${stageId}/rules`);
  return response?.data ? (response.data as StageRule) : null;
}

export async function getStageRulePresets() {
  const response = await authenticatedFetch(`/api/admin/stage-rule-presets`);
  return (response?.data || []) as StageRulePreset[];
}

export async function createStageRulePreset(data: Omit<StageRulePreset, 'id' | 'createdAt'>) {
  const response = await authenticatedFetch(`/api/admin/stage-rule-presets`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath('/stage-rule-presets');
  return response?.data as StageRulePreset;
}

export async function updateStageRulePreset(
  id: string,
  data: Omit<StageRulePreset, 'id' | 'createdAt'>,
) {
  const response = await authenticatedFetch(`/api/admin/stage-rule-presets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath('/stage-rule-presets');
  return response?.data as StageRulePreset;
}

export async function deleteStageRulePreset(id: string) {
  const response = await authenticatedFetch(`/api/admin/stage-rule-presets/${id}`, {
    method: 'DELETE',
  });

  revalidatePath('/stage-rule-presets');
  return response?.data;
}

export async function createStageRules(
  tournamentId: string,
  stageId: string,
  data: StageRule,
) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data as StageRule;
}

export async function updateStageRules(
  tournamentId: string,
  stageId: string,
  data: StageRule,
) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/rules`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data as StageRule;
}

export async function deleteStageRules(tournamentId: string, stageId: string) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/rules`, {
    method: 'DELETE',
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data;
}

export async function getStagesWithRules(tournamentId: string, params: GetStagesParams = {}) {
  const stagesResult = await getStages(tournamentId, params);

  const stagesWithRules = await Promise.all(
    stagesResult.data.map(async (stage) => {
      const rules = await getStageRules(stage.id);
      return {
        ...stage,
        rules,
      };
    }),
  );

  return {
    data: stagesWithRules,
    pagination: stagesResult.pagination,
  };
}

export async function getParticipants(tournamentId: string, params: GetParticipantsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.orderBy) queryParams.set('orderBy', params.orderBy);
  if (params.order) queryParams.set('order', params.order);

  const response = await authenticatedFetch(
    `/api/admin/tournaments/${tournamentId}/participants?${queryParams.toString()}`,
  );

  return {
    data: (response?.data || []) as Participant[],
    pagination: (response?.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: 0,
      totalPages: 0,
    }) as PaginationMeta,
  };
}

export async function getGroups(stageId: string, params: GetGroupsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.orderBy) queryParams.set('orderBy', params.orderBy);
  if (params.order) queryParams.set('order', params.order);

  const response = await authenticatedFetch(
    `/api/admin/stages/${stageId}/groups?${queryParams.toString()}`,
  );

  return {
    data: (response?.data || []) as Group[],
    pagination: (response?.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: 0,
      totalPages: 0,
    }) as PaginationMeta,
  };
}

export async function createGroup(stageId: string, data: { name: string; groupOrder?: number }) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/groups`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  return response?.data as Group;
}

export async function updateGroup(groupId: string, data: { name?: string; groupOrder?: number }) {
  const response = await authenticatedFetch(`/api/admin/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  return response?.data as Group;
}

export async function deleteGroup(groupId: string) {
  const response = await authenticatedFetch(`/api/admin/groups/${groupId}`, {
    method: 'DELETE',
  });

  revalidatePath('/tournaments');
  return response?.data;
}

export async function getGroupMembers(groupId: string, params: GetGroupMembersParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.orderBy) queryParams.set('orderBy', params.orderBy);
  if (params.order) queryParams.set('order', params.order);

  const response = await authenticatedFetch(
    `/api/admin/groups/${groupId}/members?${queryParams.toString()}`,
  );

  return {
    data: (response?.data || []) as GroupMember[],
    pagination: (response?.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: 0,
      totalPages: 0,
    }) as PaginationMeta,
  };
}

export async function createGroupMember(
  groupId: string,
  data: { tournamentParticipantId: string; seedInGroup?: number; status?: string },
) {
  const response = await authenticatedFetch(`/api/admin/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  return response?.data as GroupMember;
}

export async function updateGroupMember(
  groupId: string,
  participantId: string,
  data: { seedInGroup?: number; status?: string },
) {
  const response = await authenticatedFetch(`/api/admin/groups/${groupId}/members/${participantId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  return response?.data as GroupMember;
}

export async function deleteGroupMember(groupId: string, participantId: string) {
  const response = await authenticatedFetch(
    `/api/admin/groups/${groupId}/members/${participantId}`,
    {
      method: 'DELETE',
    },
  );

  revalidatePath('/tournaments');
  return response?.data;
}

export async function generateBracket(
  stageId: string,
  data:
    | { sourceType: 'SEED'; size: number; seedOrder: string; bestOf?: number }
    | {
      sourceType: 'GROUP_RANK';
      sourceStageId: string;
      topNPerGroup: number;
      wildcardCount?: number;
      size: number;
    },
) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/bracket/generate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath('/tournaments');
  return response?.data;
}

export async function getBracket(stageId: string) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/bracket`);
  return response?.data as StageBracket;
}

export async function resolveBracket(stageId: string) {
  const response = await authenticatedFetch(`/api/admin/stages/${stageId}/bracket/resolve`, {
    method: 'POST',
  });

  revalidatePath('/tournaments');
  return response?.data;
}

export async function getMemberOptions(params: GetMemberOptionsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const response = await authenticatedFetch(`/api/admin/members?${queryParams.toString()}`);

  return {
    data: (response?.data || []) as MemberOption[],
    pagination: (response?.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: 0,
      totalPages: 0,
    }) as PaginationMeta,
  };
}

export async function createParticipant(
  tournamentId: string,
  data: { displayName: string; memberIds?: string[]; seed?: number; status?: string },
) {
  const response = await authenticatedFetch(`/api/admin/tournaments/${tournamentId}/participants`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data as Participant;
}

export async function updateParticipant(
  tournamentId: string,
  participantId: string,
  data: { displayName: string; memberIds?: string[]; seed?: number; status?: string },
) {
  const response = await authenticatedFetch(`/api/admin/participants/${participantId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data as Participant;
}

export async function deleteParticipant(tournamentId: string, participantId: string) {
  const response = await authenticatedFetch(`/api/admin/participants/${participantId}`, {
    method: 'DELETE',
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data;
}


export interface DrawSession {
  id: string;
  tournamentId: string;
  stageId: string | null;
  type: 'DOUBLES_PAIRING' | 'GROUP_ASSIGNMENT' | 'KNOCKOUT_PAIRING';
  status: 'PENDING' | 'APPLIED';
  payload: any;
  result: any;
  createdAt: string;
}

export async function createDraw(data: {
  tournamentId: string;
  stageId?: string;
  type: 'DOUBLES_PAIRING' | 'GROUP_ASSIGNMENT' | 'KNOCKOUT_PAIRING';
  payload: any;
}) {
  const response = await authenticatedFetch(`/api/admin/draws`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath(`/tournaments/${data.tournamentId}`);
  return response?.data as DrawSession;
}

export async function getDraws(params: {
  tournamentId?: string;
  stageId?: string;
  type?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.tournamentId) queryParams.set('tournamentId', params.tournamentId);
  if (params.stageId) queryParams.set('stageId', params.stageId);
  if (params.type) queryParams.set('type', params.type);

  const response = await authenticatedFetch(`/api/admin/draws?${queryParams.toString()}`);
  return (response?.data || []) as DrawSession[];
}

export async function updateDraw(id: string, data: { payload?: any; result?: any }) {
  const response = await authenticatedFetch(`/api/admin/draws/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response?.data as DrawSession;
}

export async function applyDraw(id: string, tournamentId: string) {
  const response = await authenticatedFetch(`/api/admin/draws/${id}/apply`, {
    method: 'POST',
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data;
}

export async function seedParticipantsByElo(tournamentId: string) {
  const response = await authenticatedFetch(`/api/admin/tournaments/${tournamentId}/participants/seed`, {
    method: 'POST',
    body: JSON.stringify({ by: 'elo' }),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return response?.data;
}

