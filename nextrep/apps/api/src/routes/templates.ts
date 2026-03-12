import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { workoutTemplates, templateExercises } from '../db/schema';
import { CreateTemplateSchema } from '@nextrep/shared';
import { sendSuccess, sendError } from '../utils/errors';

export async function templateRoutes(app: FastifyInstance) {
  // GET /templates
  app.get('/templates', async (req, reply) => {
    const rows = await db.query.workoutTemplates.findMany({
      where: and(eq(workoutTemplates.userId, req.userId!), eq(workoutTemplates.isArchived, false)),
      with: { exercises: { with: { exercise: true }, orderBy: (e, { asc }) => [asc(e.orderIndex)] } },
      orderBy: (t, { desc }) => [desc(t.updatedAt)],
    });
    return sendSuccess(reply, rows);
  });

  // GET /templates/:id
  app.get('/templates/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const template = await db.query.workoutTemplates.findFirst({
      where: and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, req.userId!)),
      with: { exercises: { with: { exercise: true }, orderBy: (e, { asc }) => [asc(e.orderIndex)] } },
    });
    if (!template) return sendError(reply, 404, 'NOT_FOUND', 'Template not found');
    return sendSuccess(reply, template);
  });

  // POST /templates
  app.post('/templates', async (req, reply) => {
    const body = CreateTemplateSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const { name, description, exercises: exs } = body.data;

    const [template] = await db.insert(workoutTemplates).values({
      userId: req.userId!,
      name,
      description,
    }).returning();

    if (exs?.length) {
      await db.insert(templateExercises).values(
        exs.map((ex, i) => ({
          templateId: template.id,
          exerciseId: ex.exerciseId,
          orderIndex: i,
          defaultSets: ex.defaultSets ?? 3,
          defaultReps: ex.defaultReps ?? 10,
          defaultWeightKg: ex.defaultWeightKg ?? null,
          restSeconds: ex.restSeconds ?? 90,
          supersetGroup: ex.supersetGroup ?? null,
        })),
      );
    }

    return sendSuccess(reply, template, 201);
  });

  // PUT /templates/:id
  app.put('/templates/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateTemplateSchema.partial().safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const existing = await db.query.workoutTemplates.findFirst({
      where: and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, req.userId!)),
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Template not found');

    const { exercises: exs, ...rest } = body.data as any;

    const [updated] = await db.update(workoutTemplates)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(workoutTemplates.id, id))
      .returning();

    if (exs) {
      await db.delete(templateExercises).where(eq(templateExercises.templateId, id));
      if (exs.length) {
        await db.insert(templateExercises).values(
          exs.map((ex: any, i: number) => ({
            templateId: id,
            exerciseId: ex.exerciseId,
            orderIndex: i,
            defaultSets: ex.defaultSets ?? 3,
            defaultReps: ex.defaultReps ?? 10,
            defaultWeightKg: ex.defaultWeightKg ?? null,
            restSeconds: ex.restSeconds ?? 90,
            supersetGroup: ex.supersetGroup ?? null,
          })),
        );
      }
    }

    return sendSuccess(reply, updated);
  });

  // DELETE /templates/:id
  app.delete('/templates/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await db.query.workoutTemplates.findFirst({
      where: and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, req.userId!)),
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Template not found');

    await db.update(workoutTemplates).set({ isArchived: true }).where(eq(workoutTemplates.id, id));
    return sendSuccess(reply, null, 204);
  });
}
