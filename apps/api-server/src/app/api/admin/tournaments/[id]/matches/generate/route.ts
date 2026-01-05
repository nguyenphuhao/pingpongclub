/**
 * Unified Match Generation API
 * POST - Generate matches for either FINAL (bracket) or GROUP stage
 */

import { NextRequest } from 'next/server';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { BracketService } from '@/server/modules/tournament/application/bracket.service';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { PrismaClient } from '@prisma/client';
import { GenerateMatchesDto } from '@/server/modules/tournament/domain/match.types';

const prisma = new PrismaClient();
const bracketService = new BracketService(prisma);
const groupService = new GroupService(prisma);

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches/generate:
 *   post:
 *     tags:
 *       - Admin - Tournament Matches (Unified)
 *     summary: Generate matches for tournament (Admin) - UNIFIED ENDPOINT
 *     description: |
 *       Unified endpoint to generate matches for either FINAL stage (bracket) or GROUP stage (round robin).
 *
 *       This endpoint replaces:
 *       - POST /tournaments/:id/bracket/generate (for FINAL stage)
 *       - POST /tournaments/:id/groups/:gid/generate-matches (for GROUP stage)
 *
 *       **For FINAL stage (bracket)**:
 *       - Generates single-elimination bracket for all checked-in participants
 *       - For TWO_STAGES tournaments: creates virtual participants for group advancing spots
 *       - Generates ALL rounds upfront with virtual participants for rounds 2+
 *       - Supports 3rd place match
 *
 *       **For GROUP stage (round robin)**:
 *       - Generates round-robin matches for all participants in the specified group
 *       - Supports multiple matchups per pair (e.g., home/away)
 *       - All participants must be assigned to the group
 *
 *       **Virtual Participants**:
 *       - FINAL stage creates virtual participants like "Nhất bảng A", "Thắng trận 1 (Vòng 1)"
 *       - GROUP stage always uses real participants (no virtual)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stage
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [FINAL, GROUP]
 *                 description: Stage type (FINAL for bracket, GROUP for round robin)
 *               groupId:
 *                 type: string
 *                 description: Group ID (required if stage = GROUP)
 *               includeThirdPlaceMatch:
 *                 type: boolean
 *                 default: false
 *                 description: Create 3rd place match (only for FINAL stage)
 *               matchupsPerPair:
 *                 type: integer
 *                 default: 1
 *                 description: Number of matches per pair (only for GROUP stage)
 *           examples:
 *             bracketGeneration:
 *               summary: Generate bracket (FINAL stage)
 *               value:
 *                 stage: FINAL
 *                 includeThirdPlaceMatch: true
 *             groupGeneration:
 *               summary: Generate group matches (GROUP stage)
 *               value:
 *                 stage: GROUP
 *                 groupId: group-A-id
 *                 matchupsPerPair: 2
 *     responses:
 *       200:
 *         description: Matches generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       description: Bracket response (if stage = FINAL)
 *                       properties:
 *                         totalMatches:
 *                           type: integer
 *                         rounds:
 *                           type: array
 *                           items:
 *                             type: object
 *                     - type: object
 *                       description: Group matches response (if stage = GROUP)
 *                       properties:
 *                         matches:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid request or validation error
 *       404:
 *         description: Tournament or group not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body: GenerateMatchesDto = await request.json();

    const { stage, groupId, includeThirdPlaceMatch, matchupsPerPair } = body;

    // Validate required fields
    if (!stage) {
      throw new Error('stage là bắt buộc (FINAL hoặc GROUP)');
    }

    if (stage !== 'FINAL' && stage !== 'GROUP') {
      throw new Error('stage phải là "FINAL" hoặc "GROUP"');
    }

    if (stage === 'GROUP' && !groupId) {
      throw new Error('groupId là bắt buộc khi stage = GROUP');
    }

    // Route to appropriate service based on stage
    if (stage === 'FINAL') {
      // Generate bracket using BracketService
      const bracket = await bracketService.generateBracket(
        params.id,
        {
          includeThirdPlaceMatch: includeThirdPlaceMatch || false,
        },
        { user },
      );

      return successResponse({
        stage: 'FINAL',
        message: 'Đã tạo bảng đấu thành công',
        ...bracket,
      });
    } else {
      // Generate group matches using GroupService
      if (!groupId) {
        throw new Error('groupId là bắt buộc khi tạo matches cho GROUP stage');
      }

      const matches = await groupService.generateMatches(
        params.id,
        groupId,
        {
          matchupsPerPair: matchupsPerPair || 1,
        },
        { user },
      );

      return successResponse({
        stage: 'GROUP',
        groupId,
        message: 'Đã tạo lịch thi đấu cho bảng thành công',
        matches,
        totalMatches: matches.length,
      });
    }
  } catch (error: any) {
    return errorResponse(error);
  }
}
