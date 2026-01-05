/**
 * Virtual Participant Helper
 * Helper functions for creating and managing virtual participants (placeholders)
 */

import { PrismaClient, TournamentGroup } from '@prisma/client';

export interface VirtualParticipantAdvancingSource {
  type: 'group' | 'match';
  groupId?: string;
  groupName?: string;
  rank?: number; // 1 = first place, 2 = second place
  matchId?: string;
  position?: 'winner' | 'loser';
}

export class VirtualParticipantHelper {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create virtual participant for group advancing spot
   * Example: "Nhất bảng A", "Nhì bảng B"
   */
  async createGroupAdvancingVirtualParticipant(
    tournamentId: string,
    group: { id: string; name: string; displayName: string },
    rank: number, // 1 for first, 2 for second
  ): Promise<string> {
    const rankText = rank === 1 ? 'Nhất' : rank === 2 ? 'Nhì' : `Hạng ${rank}`;
    const displayName = `${rankText} ${group.displayName || group.name}`;

    const advancingSource: VirtualParticipantAdvancingSource = {
      type: 'group',
      groupId: group.id,
      groupName: group.name,
      rank,
    };

    const participant = await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: null,
        isVirtual: true,
        displayName,
        advancingSource: JSON.stringify(advancingSource),
        status: 'REGISTERED', // Virtual participants start as REGISTERED
      },
    });

    return participant.id;
  }

  /**
   * Create virtual participant for match winner/loser
   * Example: "Winner of Match 1", "Loser of Match 2"
   */
  async createMatchAdvancingVirtualParticipant(
    tournamentId: string,
    matchId: string,
    matchNumber: number,
    round: number,
    position: 'winner' | 'loser',
  ): Promise<string> {
    const positionText = position === 'winner' ? 'Thắng' : 'Thua';
    const displayName = `${positionText} trận ${matchNumber} (Vòng ${round})`;

    const advancingSource: VirtualParticipantAdvancingSource = {
      type: 'match',
      matchId,
      position,
    };

    const participant = await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: null,
        isVirtual: true,
        displayName,
        advancingSource: JSON.stringify(advancingSource),
        status: 'REGISTERED',
      },
    });

    return participant.id;
  }

  /**
   * Create all virtual participants for TWO_STAGES tournament bracket
   * Creates placeholders for all advancing spots from groups
   */
  async createVirtualParticipantsForTwoStages(
    tournamentId: string,
  ): Promise<Array<{ id: string; groupId: string; rank: number; displayName: string }>> {
    // Get all groups for this tournament
    const groups = await this.prisma.tournamentGroup.findMany({
      where: { tournamentId },
      orderBy: { name: 'asc' },
    });

    if (groups.length === 0) {
      throw new Error('Không tìm thấy bảng đấu nào');
    }

    // Get advancing count from first group (assuming all groups have same config)
    const advancingPerGroup = groups[0].participantsAdvancing;

    const virtualParticipants: Array<{
      id: string;
      groupId: string;
      rank: number;
      displayName: string;
    }> = [];

    // Create virtual participants for each advancing spot
    for (const group of groups) {
      for (let rank = 1; rank <= advancingPerGroup; rank++) {
        const participantId = await this.createGroupAdvancingVirtualParticipant(
          tournamentId,
          group,
          rank,
        );

        virtualParticipants.push({
          id: participantId,
          groupId: group.id,
          rank,
          displayName: `${rank === 1 ? 'Nhất' : 'Nhì'} ${group.displayName || group.name}`,
        });
      }
    }

    return virtualParticipants;
  }

  /**
   * Replace virtual participant with real participant when they advance
   * This will be called manually by admin or automatically on match completion
   */
  async replaceVirtualParticipant(
    virtualParticipantId: string,
    realParticipantId: string,
  ): Promise<void> {
    // Get the virtual participant
    const virtualParticipant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: virtualParticipantId },
    });

    if (!virtualParticipant || !virtualParticipant.isVirtual) {
      throw new Error('Virtual participant không tồn tại');
    }

    // Update all matches that have this virtual participant
    const matchParticipants = await this.prisma.tournamentMatchParticipant.findMany({
      where: { participantId: virtualParticipantId },
    });

    for (const mp of matchParticipants) {
      await this.prisma.tournamentMatchParticipant.update({
        where: { id: mp.id },
        data: { participantId: realParticipantId },
      });
    }

    // Delete the virtual participant
    await this.prisma.tournamentParticipant.delete({
      where: { id: virtualParticipantId },
    });
  }

  /**
   * Get virtual participant details including advancing source
   */
  async getVirtualParticipantDetails(participantId: string): Promise<{
    id: string;
    displayName: string;
    advancingSource: VirtualParticipantAdvancingSource | null;
  } | null> {
    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || !participant.isVirtual) {
      return null;
    }

    return {
      id: participant.id,
      displayName: participant.displayName || 'TBD',
      advancingSource: participant.advancingSource
        ? JSON.parse(participant.advancingSource)
        : null,
    };
  }
}
