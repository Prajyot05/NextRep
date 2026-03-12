import { FastifyInstance } from 'fastify';
import { getUserMilestones } from '../services/milestoneService';
import { sendSuccess } from '../utils/errors';

export async function milestoneRoutes(app: FastifyInstance) {
  // GET /milestones
  app.get('/milestones', async (req, reply) => {
    const data = await getUserMilestones(req.userId!);
    return sendSuccess(reply, data);
  });
}
