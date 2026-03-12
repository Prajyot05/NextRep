import { FastifyInstance } from 'fastify';
import { getStreak, getStreakCalendar } from '../services/streakService';
import { sendSuccess } from '../utils/errors';

export async function streakRoutes(app: FastifyInstance) {
  // GET /streaks
  app.get('/streaks', async (req, reply) => {
    const streak = await getStreak(req.userId!);
    return sendSuccess(reply, streak);
  });

  // GET /streaks/calendar?months=3
  app.get('/streaks/calendar', async (req, reply) => {
    const { months = '3' } = req.query as { months?: string };
    const calendar = await getStreakCalendar(req.userId!, parseInt(months));
    return sendSuccess(reply, calendar);
  });
}
