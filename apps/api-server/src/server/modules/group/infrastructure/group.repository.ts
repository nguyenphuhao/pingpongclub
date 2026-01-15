/**
 * Group Repository
 *
 * Handles database operations for groups and group members
 */

import { prisma, Prisma, Group, GroupMember } from '@pingclub/database';
import { GetGroupsQuery, GetGroupMembersQuery } from '../domain/group.types';

export class GroupRepository {
  async findGroupsByStage(stageId: string, query: GetGroupsQuery): Promise<Group[]> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'groupOrder',
      order = 'asc',
    } = query;

    const orderByInput: Prisma.GroupOrderByWithRelationInput = {};
    if (orderBy === 'name') {
      orderByInput.name = order;
    } else if (orderBy === 'createdAt') {
      orderByInput.id = order;
    } else {
      orderByInput.groupOrder = order;
    }

    return await prisma.group.findMany({
      where: { stageId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByInput,
    });
  }

  async countGroupsByStage(stageId: string): Promise<number> {
    return await prisma.group.count({ where: { stageId } });
  }

  async findGroupById(id: string): Promise<Group | null> {
    return await prisma.group.findUnique({
      where: { id },
    });
  }

  async findGroupByStageAndName(stageId: string, name: string): Promise<Group | null> {
    return await prisma.group.findFirst({
      where: { stageId, name },
    });
  }

  async createGroup(data: Prisma.GroupCreateInput): Promise<Group> {
    return await prisma.group.create({ data });
  }

  async updateGroup(id: string, data: Prisma.GroupUpdateInput): Promise<Group> {
    return await prisma.group.update({
      where: { id },
      data,
    });
  }

  async deleteGroup(id: string): Promise<Group> {
    return await prisma.group.delete({
      where: { id },
    });
  }

  async findGroupMembersByGroup(
    groupId: string,
    query: GetGroupMembersQuery,
  ): Promise<GroupMember[]> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      orderBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: Prisma.GroupMemberWhereInput = {
      groupId,
    };

    if (status) {
      where.status = status;
    }

    if (search && search.length >= 2) {
      where.tournamentParticipant = {
        displayName: { contains: search, mode: 'insensitive' },
      };
    }

    const orderByInput: Prisma.GroupMemberOrderByWithRelationInput = {};
    if (orderBy === 'seedInGroup') {
      orderByInput.seedInGroup = order;
    } else {
      orderByInput.groupId = order;
    }

    return await prisma.groupMember.findMany({
      where,
      include: {
        tournamentParticipant: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByInput,
    });
  }

  async countGroupMembersByGroup(
    groupId: string,
    query: GetGroupMembersQuery,
  ): Promise<number> {
    const { search, status } = query;

    const where: Prisma.GroupMemberWhereInput = {
      groupId,
    };

    if (status) {
      where.status = status;
    }

    if (search && search.length >= 2) {
      where.tournamentParticipant = {
        displayName: { contains: search, mode: 'insensitive' },
      };
    }

    return await prisma.groupMember.count({ where });
  }

  async findGroupMember(
    groupId: string,
    tournamentParticipantId: string,
  ): Promise<GroupMember | null> {
    return await prisma.groupMember.findUnique({
      where: {
        groupId_tournamentParticipantId: {
          groupId,
          tournamentParticipantId,
        },
      },
    });
  }

  async createGroupMember(data: Prisma.GroupMemberCreateInput): Promise<GroupMember> {
    return await prisma.groupMember.create({ data });
  }

  async updateGroupMember(
    groupId: string,
    tournamentParticipantId: string,
    data: Prisma.GroupMemberUpdateInput,
  ): Promise<GroupMember> {
    return await prisma.groupMember.update({
      where: {
        groupId_tournamentParticipantId: {
          groupId,
          tournamentParticipantId,
        },
      },
      data,
    });
  }

  async deleteGroupMember(
    groupId: string,
    tournamentParticipantId: string,
  ): Promise<GroupMember> {
    return await prisma.groupMember.delete({
      where: {
        groupId_tournamentParticipantId: {
          groupId,
          tournamentParticipantId,
        },
      },
    });
  }
}
