/**
 * Admin Tournament Detail API Routes
 *
 * GET /api/admin/tournaments/:id - Get tournament details
 * PATCH /api/admin/tournaments/:id - Update tournament
 * DELETE /api/admin/tournaments/:id - Delete tournament (soft delete)
 */

import { NextRequest } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { UpdateTournamentDto } from '@/server/modules/tournament/domain/tournament.types';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}:
 *   get:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Get tournament details (Admin)
 *     description: Get detailed information about a specific tournament
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Tournament not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Build request context
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Get tournament
    const tournament = await tournamentService.getTournamentById(params.id, ctx);

    return successResponse(tournament);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}:
 *   patch:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Update tournament (Admin)
 *     description: Update tournament details and configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               registrationStartTime:
 *                 type: string
 *                 format: date-time
 *               isTentative:
 *                 type: boolean
 *               singleStageConfig:
 *                 type: object
 *               twoStagesConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Tournament not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Parse request body
    const body = await request.json();

    // Build DTO
    const dto: UpdateTournamentDto = {
      name: body.name,
      description: body.description,
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

    // Update tournament
    const tournament = await tournamentService.updateTournament(params.id, dto, ctx);

    return successResponse(tournament);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}:
 *   delete:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Delete tournament (Admin)
 *     description: Soft delete a tournament
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tournament deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Tournament not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Build request context
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Delete tournament
    await tournamentService.deleteTournament(params.id, ctx);

    return successResponse({ message: 'Tournament deleted successfully' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
