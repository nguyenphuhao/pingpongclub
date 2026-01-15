/**
 * Admin Tournament Detail API Routes
 *
 * GET /api/admin/tournaments/:id - Get tournament detail
 * PATCH /api/admin/tournaments/:id - Update tournament
 * DELETE /api/admin/tournaments/:id - Delete tournament
 */

import { NextRequest } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateTournamentDtoSchema } from '@/shared/dtos';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}:
 *   get:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Chi tiet giai dau (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem chi tiet giai dau.'
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
 *         description: Not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const tournament = await tournamentService.getTournamentById(params.id);

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
 *     summary: Cap nhat giai dau (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat giai dau.'
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
 *                 nullable: true
 *               matchFormat:
 *                 type: string
 *                 enum: [SINGLE, DOUBLES]
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(UpdateTournamentDtoSchema, body);

    const updated = await tournamentService.updateTournament(params.id, dto);

    return successResponse(updated);
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
 *     summary: Xoa giai dau (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa giai dau (xoa vinh vien).'
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
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    await tournamentService.deleteTournament(params.id);

    return successResponse({ message: 'Da xoa giai dau thanh cong' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
