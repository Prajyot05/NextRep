import { FastifyInstance } from 'fastify';
import {
  getDashboardOverview,
  getStrengthCurve,
  getVolumeTrend,
  getFrequencyHeatmap,
  getMuscleVolume,
  getMuscleBalance,
  getDurationTrend,
  getRecordsBoard,
} from '../services/analyticsService';
import { sendSuccess } from '../utils/errors';

export async function analyticsRoutes(app: FastifyInstance) {
  app.get('/analytics/overview', async (req, reply) => {
    const data = await getDashboardOverview(req.userId!);
    return sendSuccess(reply, data);
  });

  app.get('/analytics/strength/:exerciseId', async (req, reply) => {
    const { exerciseId } = req.params as { exerciseId: string };
    const { days = '90' } = req.query as { days?: string };
    const data = await getStrengthCurve(req.userId!, exerciseId, parseInt(days));
    return sendSuccess(reply, data);
  });

  app.get('/analytics/volume', async (req, reply) => {
    const { weeks = '12' } = req.query as { weeks?: string };
    const data = await getVolumeTrend(req.userId!, parseInt(weeks));
    return sendSuccess(reply, data);
  });

  app.get('/analytics/frequency', async (req, reply) => {
    const data = await getFrequencyHeatmap(req.userId!);
    return sendSuccess(reply, data);
  });

  app.get('/analytics/tonnage', async (req, reply) => {
    const { weeks = '8' } = req.query as { weeks?: string };
    const data = await getMuscleVolume(req.userId!, parseInt(weeks));
    return sendSuccess(reply, data);
  });

  app.get('/analytics/muscle-balance', async (req, reply) => {
    const { days = '30' } = req.query as { days?: string };
    const data = await getMuscleBalance(req.userId!, parseInt(days));
    return sendSuccess(reply, data);
  });

  app.get('/analytics/duration', async (req, reply) => {
    const { weeks = '12' } = req.query as { weeks?: string };
    const data = await getDurationTrend(req.userId!, parseInt(weeks));
    return sendSuccess(reply, data);
  });

  app.get('/analytics/records', async (req, reply) => {
    const data = await getRecordsBoard(req.userId!);
    return sendSuccess(reply, data);
  });
}
