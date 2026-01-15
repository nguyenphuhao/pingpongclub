/**
 * Group Service
 *
 * Business logic for group and group member operations
 */

import { prisma, Prisma, Group, GroupMember } from '@pingclub/database';
import { GroupRepository } from '../infrastructure/group.repository';
import { GetGroupsQuery, GetGroupMembersQuery, PaginatedResponse } from '../domain/group.types';
import { BadRequestException, NotFoundException } from '@/server/common/exceptions';

export class GroupService {
  private repository: GroupRepository;

  constructor() {
    this.repository = new GroupRepository();
  }

  async getGroupsByStage(
    stageId: string,
    query: GetGroupsQuery,
  ): Promise<PaginatedResponse<Group>> {
    await this.ensureStageExists(stageId);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const groups = await this.repository.findGroupsByStage(stageId, {
      ...query,
      page,
      limit,
    });
    const total = await this.repository.countGroupsByStage(stageId);

    return {
      data: groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGroupById(id: string): Promise<Group> {
    const group = await this.repository.findGroupById(id);
    if (!group) {
      throw new NotFoundException('Không tìm thấy group');
    }

    return group;
  }

  async createGroup(
    stageId: string,
    data: { name: string; groupOrder?: number },
  ): Promise<Group> {
    await this.ensureStageExists(stageId);

    const name = data.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên group là bắt buộc');
    }

    const existing = await this.repository.findGroupByStageAndName(stageId, name);
    if (existing) {
      throw new BadRequestException('Tên group đã tồn tại trong stage');
    }

    if (data.groupOrder !== undefined && (!Number.isInteger(data.groupOrder) || data.groupOrder < 1)) {
      throw new BadRequestException('Thứ tự group không hợp lệ');
    }

    const createData: Prisma.GroupCreateInput = {
      name,
      groupOrder: data.groupOrder ?? null,
      stage: {
        connect: { id: stageId },
      },
    };

    return await this.repository.createGroup(createData);
  }

  async updateGroup(
    id: string,
    data: { name?: string; groupOrder?: number },
  ): Promise<Group> {
    const existing = await this.repository.findGroupById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy group');
    }

    const updateData: Prisma.GroupUpdateInput = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('Tên group là bắt buộc');
      }

      const duplicate = await this.repository.findGroupByStageAndName(existing.stageId, name);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Tên group đã tồn tại trong stage');
      }

      updateData.name = name;
    }

    if (data.groupOrder !== undefined) {
      if (!Number.isInteger(data.groupOrder) || data.groupOrder < 1) {
        throw new BadRequestException('Thứ tự group không hợp lệ');
      }
      updateData.groupOrder = data.groupOrder;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    return await this.repository.updateGroup(id, updateData);
  }

  async deleteGroup(id: string): Promise<void> {
    const existing = await this.repository.findGroupById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy group');
    }

    await this.repository.deleteGroup(id);
  }

  async getGroupMembers(
    groupId: string,
    query: GetGroupMembersQuery,
  ): Promise<PaginatedResponse<GroupMember>> {
    await this.ensureGroupExists(groupId);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const members = await this.repository.findGroupMembersByGroup(groupId, {
      ...query,
      page,
      limit,
    });
    const total = await this.repository.countGroupMembersByGroup(groupId, query);

    return {
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createGroupMember(
    groupId: string,
    data: { tournamentParticipantId: string; seedInGroup?: number; status?: string },
  ): Promise<GroupMember> {
    const group = await this.ensureGroupExists(groupId);

    const tournamentParticipantId = data.tournamentParticipantId?.trim();
    if (!tournamentParticipantId) {
      throw new BadRequestException('Participant ID là bắt buộc');
    }

    const participant = await prisma.tournamentParticipant.findUnique({
      where: { id: tournamentParticipantId },
      select: { id: true, tournamentId: true },
    });

    if (!participant) {
      throw new NotFoundException('Không tìm thấy participant');
    }

    if (participant.tournamentId !== group.tournamentId) {
      throw new BadRequestException('Participant không thuộc giải đấu của group');
    }

    if (group.matchFormat === 'DOUBLES') {
      const memberCount = await prisma.tournamentParticipantMember.count({
        where: { tournamentParticipantId },
      });
      if (memberCount !== 2) {
        throw new BadRequestException('Giải đôi yêu cầu participant có đúng 2 thành viên');
      }
    }

    const existingInTournament = await prisma.groupMember.findFirst({
      where: {
        tournamentParticipantId,
        group: {
          stage: {
            tournamentId: group.tournamentId,
          },
        },
      },
    });
    if (existingInTournament) {
      throw new BadRequestException('Participant đã thuộc group khác trong giải đấu');
    }

    const existing = await this.repository.findGroupMember(groupId, tournamentParticipantId);
    if (existing) {
      throw new BadRequestException('Participant đã tồn tại trong group');
    }

    if (data.seedInGroup !== undefined && (!Number.isInteger(data.seedInGroup) || data.seedInGroup < 1)) {
      throw new BadRequestException('Seed trong group không hợp lệ');
    }

    const createData: Prisma.GroupMemberCreateInput = {
      seedInGroup: data.seedInGroup ?? null,
      status: data.status ?? 'active',
      group: {
        connect: { id: groupId },
      },
      tournamentParticipant: {
        connect: { id: tournamentParticipantId },
      },
    };

    return await this.repository.createGroupMember(createData);
  }

  async updateGroupMember(
    groupId: string,
    tournamentParticipantId: string,
    data: { seedInGroup?: number; status?: string },
  ): Promise<GroupMember> {
    await this.ensureGroupExists(groupId);

    const existing = await this.repository.findGroupMember(groupId, tournamentParticipantId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy group member');
    }

    const updateData: Prisma.GroupMemberUpdateInput = {};

    if (data.seedInGroup !== undefined) {
      if (!Number.isInteger(data.seedInGroup) || data.seedInGroup < 1) {
        throw new BadRequestException('Seed trong group không hợp lệ');
      }
      updateData.seedInGroup = data.seedInGroup;
    }

    if (data.status !== undefined) {
      const status = data.status.trim();
      if (!status) {
        throw new BadRequestException('Trạng thái không hợp lệ');
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cập nhật');
    }

    return await this.repository.updateGroupMember(groupId, tournamentParticipantId, updateData);
  }

  async deleteGroupMember(groupId: string, tournamentParticipantId: string): Promise<void> {
    await this.ensureGroupExists(groupId);

    const existing = await this.repository.findGroupMember(groupId, tournamentParticipantId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy group member');
    }

    await this.repository.deleteGroupMember(groupId, tournamentParticipantId);
  }

  private async ensureStageExists(stageId: string): Promise<void> {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!stage) {
      throw new NotFoundException('Không tìm thấy stage');
    }
  }

  private async ensureGroupExists(
    groupId: string,
  ): Promise<Group & { tournamentId: string; matchFormat: string }> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        stage: {
          select: {
            tournamentId: true,
            tournament: {
              select: {
                matchFormat: true,
              },
            },
          },
        },
        stageId: true,
        name: true,
        groupOrder: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Không tìm thấy group');
    }

    return {
      id: group.id,
      stageId: group.stageId,
      name: group.name,
      groupOrder: group.groupOrder,
      tournamentId: group.stage.tournamentId,
      matchFormat: group.stage.tournament.matchFormat,
    } as Group & { tournamentId: string; matchFormat: string };
  }
}
