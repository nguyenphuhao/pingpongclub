/**
 * Tournament Matches API
 * GET - List all matches (supports both FINAL and GROUP stages)
 */

import { NextRequest } from 'next/server';
import { MatchService } from '@/server/modules/tournament/application/match.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const matchService = new MatchService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches:
 *   get:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Get all matches for a tournament (Admin)
 *     description: |
 *       Returns all matches for a tournament, supports both FINAL (single elimination) and GROUP (round robin) stages.
 *
 *       Features:
 *       - Filter by stage (FINAL or GROUP)
 *       - Filter by groupId (for GROUP stage matches)
 *       - Filter by status (DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
 *       - Filter by round
 *       - Pagination support
 *       - Includes participant details with user info
 *       - Shows TBD matches (matches without participants)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [FINAL, GROUP]
 *         description: Filter by stage (FINAL for bracket, GROUP for round robin)
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filter by group ID (only for GROUP stage)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by match status
 *       - in: query
 *         name: round
 *         schema:
 *           type: integer
 *         description: Filter by round number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of matches per page
 *     responses:
 *       200:
 *         description: Matches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           stage:
 *                             type: string
 *                             enum: [FINAL, GROUP]
 *                           round:
 *                             type: integer
 *                           matchNumber:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           participants:
 *                             type: array
 *                             description: Empty array means TBD match
 *                     meta:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       404:
 *         description: Tournament not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const { searchParams } = new URL(request.url);

    // Build query from search params
    const query: any = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    };

    if (searchParams.get('stage')) {
      query.stage = searchParams.get('stage');
    }

    if (searchParams.get('groupId')) {
      query.groupId = searchParams.get('groupId');
    }

    if (searchParams.get('status')) {
      query.status = searchParams.get('status');
    }

    if (searchParams.get('round')) {
      query.round = parseInt(searchParams.get('round')!);
    }

    const result = await matchService.getMatches(params.id, query, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches:
 *   post:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Create a single match manually (Admin)
 *     description: |
 *       Create a match manually for a tournament. Supports creating:
 *       - Bracket matches (FINAL stage)
 *       - Group matches (GROUP stage)
 *       - TBD matches (matches without participants - placeholders)
 *       - Matches with specific participants
 *
 *       Use cases:
 *       - Create custom playoff matches
 *       - Create exhibition matches
 *       - Create placeholder matches for later rounds
 *       - Manual bracket/group construction
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
 *               - round
 *               - matchNumber
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [FINAL, GROUP]
 *                 description: Match stage type
 *               groupId:
 *                 type: string
 *                 description: Required if stage is GROUP
 *               round:
 *                 type: integer
 *                 description: Round number
 *               matchNumber:
 *                 type: integer
 *                 description: Match number in the round
 *               bracketPosition:
 *                 type: integer
 *                 description: Position for bracket visualization (optional)
 *               matchDate:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled match date/time
 *               courtNumber:
 *                 type: string
 *                 description: Court assignment
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 default: SCHEDULED
 *               isPlacementMatch:
 *                 type: boolean
 *                 default: false
 *                 description: Is this a placement match (e.g., 3rd place)?
 *               placementRank:
 *                 type: integer
 *                 description: Rank for placement matches (e.g., 3 for 3rd place)
 *               participants:
 *                 type: array
 *                 description: Optional - omit to create TBD match
 *                 items:
 *                   type: object
 *                   required:
 *                     - participantId
 *                     - position
 *                   properties:
 *                     participantId:
 *                       type: string
 *                     position:
 *                       type: integer
 *                       enum: [1, 2]
 *     responses:
 *       201:
 *         description: Match created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Full match details (same as GET /matches/:matchId)
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Tournament or participants not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const result = await matchService.createMatch(params.id, body, { user });

    return successResponse(result, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches:
 *   delete:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Delete all matches for a tournament (Admin)
 *     description: |
 *       Delete all matches for a tournament. This is useful when you want to:
 *       - Regenerate bracket/group matches from scratch
 *       - Reset tournament structure
 *       - Fix incorrect match generation
 *
 *       **Safety checks:**
 *       - Only ADMIN can delete matches
 *       - Cannot delete if any matches are COMPLETED (prevents data loss)
 *       - Deletes in transaction (all or nothing)
 *       - Also removes virtual participants created for matches
 *
 *       **What gets deleted:**
 *       - All tournament matches (SCHEDULED, IN_PROGRESS, CANCELLED)
 *       - All match participants
 *       - All virtual participants (placeholders like "Thắng trận 1")
 *
 *       **What remains:**
 *       - Tournament configuration
 *       - Real participants (users who registered)
 *       - Groups structure (for TWO_STAGES tournaments)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Matches deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 15
 *                     message:
 *                       type: string
 *                       example: "Đã xóa 15 trận đấu thành công"
 *       400:
 *         description: Cannot delete - tournament has completed matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Không thể xóa tất cả trận đấu vì đã có 5 trận đã hoàn thành"
 *       401:
 *         description: Unauthorized - Admin only
 *       404:
 *         description: Tournament not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    const result = await matchService.deleteAllMatches(params.id, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
