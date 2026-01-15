/**
 * Admin Tournament Participant Detail API Routes
 *
 * GET /api/admin/participants/:id - Get participant detail
 * PATCH /api/admin/participants/:id - Update participant
 * DELETE /api/admin/participants/:id - Delete participant
 */

import { NextRequest } from 'next/server';
import { TournamentParticipantService } from '@/server/modules/tournament-participant/application/tournament-participant.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateTournamentParticipantDtoSchema } from '@/shared/dtos';

const participantService = new TournamentParticipantService();

/**
 * @swagger
 * /api/admin/participants/{id}:
 *   get:
 *     tags:
 *       - Admin - Tournament Participants
 *     summary: Chi tiet participant (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem chi tiet participant.'
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

    const participant = await participantService.getParticipantById(params.id);

    return successResponse(participant);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/participants/{id}:
 *   patch:
 *     tags:
 *       - Admin - Tournament Participants
 *     summary: Cap nhat participant (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat participant.'
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
 *               displayName:
 *                 type: string
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               seed:
 *                 type: integer
 *               status:
 *                 type: string
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
    const dto = await validateBody(UpdateTournamentParticipantDtoSchema, body);

    const updated = await participantService.updateParticipant(params.id, dto);

    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/participants/{id}:
 *   delete:
 *     tags:
 *       - Admin - Tournament Participants
 *     summary: Xoa participant (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa participant.'
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

    await participantService.deleteParticipant(params.id);

    return successResponse({ message: 'Đã xóa participant thành công' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
