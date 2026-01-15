/**
 * Draw Repository
 *
 * Handles database operations for draw sessions
 */

import { prisma, DrawSession, Prisma } from '@pingclub/database';

export class DrawRepository {
  async findMany(where: Prisma.DrawSessionWhereInput) {
    return await prisma.drawSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<DrawSession | null> {
    return await prisma.drawSession.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.DrawSessionCreateInput): Promise<DrawSession> {
    return await prisma.drawSession.create({ data });
  }

  async update(id: string, data: Prisma.DrawSessionUpdateInput): Promise<DrawSession> {
    return await prisma.drawSession.update({
      where: { id },
      data,
    });
  }
}
