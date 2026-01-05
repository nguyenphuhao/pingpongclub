/**
 * Match Advancement API
 * POST - Manually advance winner/loser to next match
 */

import { NextRequest } from 'next/server';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { VirtualParticipantHelper } from '@/server/modules/tournament/application/helpers/virtual-participant.helper';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const virtualParticipantHelper = new VirtualParticipantHelper(prisma);

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches/{matchId}/advance:
 *   post:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Manually advance participant to next match (Admin)
 *     description: |
 *       Replace a virtual participant placeholder with a real participant.
 *       Used to manually advance winners/losers after a match is completed.
 *
 *       Process:
 *       1. Admin completes a match and determines winner/loser
 *       2. Call this endpoint to advance the winner to the next match
 *       3. Virtual participant placeholder is replaced with real participant
 *
 *       For TWO_STAGES tournaments:
 *       - First round has virtual participants like "Nhất bảng A", "Nhì bảng B"
 *       - Admin advances real participants to replace these placeholders
 *
 *       For subsequent rounds:
 *       - Virtual participants like "Thắng trận 1 (Vòng 1)"
 *       - Admin advances winners to replace these placeholders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Source match ID (where the participant is advancing from)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - realParticipantId
 *               - position
 *             properties:
 *               realParticipantId:
 *                 type: string
 *                 description: The real participant ID to advance
 *               position:
 *                 type: string
 *                 enum: [winner, loser]
 *                 description: Position to advance (winner for next round, loser for 3rd place)
 *     responses:
 *       200:
 *         description: Participant advanced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     updatedMatches:
 *                       type: array
 *                       description: List of matches that were updated
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request or no virtual participant found
 *       404:
 *         description: Match or participant not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const { realParticipantId, position } = body;

    if (!realParticipantId || !position) {
      throw new Error('realParticipantId và position là bắt buộc');
    }

    if (position !== 'winner' && position !== 'loser') {
      throw new Error('position phải là "winner" hoặc "loser"');
    }

    // 1. Validate match exists and belongs to tournament
    const match = await prisma.tournamentMatch.findFirst({
      where: {
        id: params.matchId,
        tournamentId: params.id,
      },
    });

    if (!match) {
      throw new Error('Không tìm thấy trận đấu');
    }

    // 2. Validate real participant exists and belongs to tournament
    const realParticipant = await prisma.tournamentParticipant.findFirst({
      where: {
        id: realParticipantId,
        tournamentId: params.id,
      },
    });

    if (!realParticipant) {
      throw new Error('Không tìm thấy người chơi');
    }

    if (realParticipant.isVirtual) {
      throw new Error('Không thể advance virtual participant');
    }

    // 3. Find virtual participants that should be replaced
    // These are participants in NEXT matches that reference this match
    const virtualParticipantsToReplace = await prisma.tournamentParticipant.findMany({
      where: {
        tournamentId: params.id,
        isVirtual: true,
      },
    });

    const updatedMatches: string[] = [];

    for (const vp of virtualParticipantsToReplace) {
      if (!vp.advancingSource) continue;

      try {
        const source = JSON.parse(vp.advancingSource);

        // Check if this virtual participant references our match and position
        if (source.type === 'match' && source.matchId === params.matchId && source.position === position) {
          // Replace this virtual participant
          await virtualParticipantHelper.replaceVirtualParticipant(vp.id, realParticipantId);

          // Track which matches were updated
          const matchParticipants = await prisma.tournamentMatchParticipant.findMany({
            where: { participantId: realParticipantId },
            include: { match: true },
          });

          matchParticipants.forEach((mp) => {
            if (!updatedMatches.includes(mp.matchId)) {
              updatedMatches.push(mp.matchId);
            }
          });
        }
      } catch (err) {
        // Skip invalid JSON
        continue;
      }
    }

    if (updatedMatches.length === 0) {
      // For TWO_STAGES, might be advancing from group to bracket
      // Check if this is a virtual participant for group position
      const groupVirtualParticipants = virtualParticipantsToReplace.filter((vp) => {
        if (!vp.advancingSource) return false;
        try {
          const source = JSON.parse(vp.advancingSource);
          return (
            source.type === 'group' &&
            source.groupId === realParticipant.groupId &&
            source.rank === body.rank // Optional rank parameter
          );
        } catch {
          return false;
        }
      });

      if (groupVirtualParticipants.length > 0) {
        for (const vp of groupVirtualParticipants) {
          await virtualParticipantHelper.replaceVirtualParticipant(vp.id, realParticipantId);

          const matchParticipants = await prisma.tournamentMatchParticipant.findMany({
            where: { participantId: realParticipantId },
            include: { match: true },
          });

          matchParticipants.forEach((mp) => {
            if (!updatedMatches.includes(mp.matchId)) {
              updatedMatches.push(mp.matchId);
            }
          });
        }
      } else {
        throw new Error(`Không tìm thấy virtual participant nào cần thay thế cho ${position} của trận này`);
      }
    }

    return successResponse({
      message: `Đã advance ${realParticipant.userId ? 'participant' : 'participant'} thành công`,
      updatedMatches,
      advancedCount: updatedMatches.length,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}
