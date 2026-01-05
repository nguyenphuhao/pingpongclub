/**
 * Admin Tournament API Routes
 *
 * GET /api/admin/tournaments - List all tournaments
 * POST /api/admin/tournaments - Create new tournament
 */

import { NextRequest } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { TournamentGameType } from '@prisma/client';
import { CreateTournamentDto } from '@/server/modules/tournament/domain/tournament.types';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments:
 *   get:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Get all tournaments (Admin)
 *     description: Get list of all tournaments with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: gameType
 *         schema:
 *           type: string
 *           enum: [SINGLE_STAGE, TWO_STAGES]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, registrationStartTime]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      status: searchParams.get('status') as any,
      gameType: searchParams.get('gameType') as any,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sortBy: searchParams.get('sortBy') as any,
      sortOrder: searchParams.get('sortOrder') as any,
    };

    // Build request context
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Get tournaments
    const result = await tournamentService.getTournaments(query, ctx);

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments:
 *   post:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Create new tournament (Admin)
 *     description: Create a new tournament with configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - gameType
 *             properties:
 *               name:
 *                 type: string
 *                 example: Championship 2026
 *               description:
 *                 type: string
 *                 example: Annual championship tournament
 *               game:
 *                 type: string
 *                 default: TABLE_TENNIS
 *               gameType:
 *                 type: string
 *                 enum: [SINGLE_STAGE, TWO_STAGES]
 *                 example: SINGLE_STAGE
 *               registrationStartTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-01-15T10:00:00Z
 *               isTentative:
 *                 type: boolean
 *                 default: false
 *               singleStageConfig:
 *                 type: object
 *                 properties:
 *                   format:
 *                     type: string
 *                     enum: [SINGLE_ELIMINATION, ROUND_ROBIN]
 *                   singleEliminationConfig:
 *                     type: object
 *                     properties:
 *                       hasPlacementMatches:
 *                         type: boolean
 *                   roundRobinConfig:
 *                     type: object
 *                     properties:
 *                       matchupsPerPair:
 *                         type: integer
 *                         default: 1
 *                       rankBy:
 *                         type: string
 *                         enum: [MATCH_WINS, POINTS]
 *                       placementMethod:
 *                         type: string
 *                         enum: [PARTICIPANT_LIST_ORDER, RANDOM, SEEDED]
 *                       tieBreaks:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [WINS_VS_TIED, GAME_SET_DIFFERENCE, POINTS_DIFFERENCE]
 *               twoStagesConfig:
 *                 type: object
 *                 properties:
 *                   groupStage:
 *                     type: object
 *                     properties:
 *                       format:
 *                         type: string
 *                         enum: [ROUND_ROBIN]
 *                       participantsPerGroup:
 *                         type: integer
 *                         default: 4
 *                       participantsAdvancing:
 *                         type: integer
 *                         default: 2
 *                       matchupsPerPair:
 *                         type: integer
 *                         default: 1
 *                       rankBy:
 *                         type: string
 *                         enum: [MATCH_WINS, POINTS]
 *                       placementMethod:
 *                         type: string
 *                         enum: [PARTICIPANT_LIST_ORDER, RANDOM, SEEDED]
 *                       tieBreaks:
 *                         type: array
 *                         items:
 *                           type: string
 *                   finalStage:
 *                     type: object
 *                     properties:
 *                       format:
 *                         type: string
 *                         enum: [SINGLE_ELIMINATION]
 *                       hasPlacementMatches:
 *                         type: boolean
 *     responses:
 *       200:
 *         description: Tournament created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Parse request body
    const body = await request.json();

    // Build DTO
    const dto: CreateTournamentDto = {
      name: body.name,
      description: body.description,
      game: body.game,
      gameType: body.gameType as TournamentGameType,
      registrationStartTime: body.registrationStartTime,
      isTentative: body.isTentative,
      singleStageConfig: body.singleStageConfig,
      twoStagesConfig: body.twoStagesConfig,
    };

    // Build request context
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Create tournament
    const tournament = await tournamentService.createTournament(dto, ctx);

    return successResponse(tournament);
  } catch (error: any) {
    return errorResponse(error);
  }
}
