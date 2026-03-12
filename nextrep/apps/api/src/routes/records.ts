import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { personalRecords } from '../db/schema';
import { sendSuccess, sendError } from '../utils/errors';

export async function recordsRoutes(app: FastifyInstance) {
  // GET /records — all PRs for current user, grouped by exercise
  app.get('/records', async (req, reply) => {
    const rows = await db.query.personalRecords.findMany({
      where: eq(personalRecords.userId, req.userId!),
      with: { exercise: true },
      orderBy: (pr, { desc }) => [desc(pr.achievedAt)],
    });

    // Group by exercise
    const grouped: Record<string, any> = {};
    for (const row of rows) {
      if (!grouped[row.exerciseId]) {
        grouped[row.exerciseId] = {
          exercise: row.exercise,
          records: {},
        };
      }
      grouped[row.exerciseId].records[row.recordType] = {
        value:      row.value,
        achievedAt: row.achievedAt,
      };
    }

    return sendSuccess(reply, Object.values(grouped));
  });

  // GET /records/:exerciseId — PRs for a specific exercise
  app.get('/records/:exerciseId', async (req, reply) => {
    const { exerciseId } = req.params as { exerciseId: string };
    const rows = await db.query.personalRecords.findMany({
      where: and(
        eq(personalRecords.userId, req.userId!),
        eq(personalRecords.exerciseId, exerciseId),
      ),
      with: { exercise: true },
    });
    if (!rows.length) return sendError(reply, 404, 'NOT_FOUND', 'No records for this exercise');
    return sendSuccess(reply, rows);
  });
}
