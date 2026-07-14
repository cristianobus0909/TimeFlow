import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TimeSession } from '../models/TimeSession';
import { Break } from '../models/Break';
import { ProjectTask } from '../models/ProjectTask';
import { StatsService } from '../services/statsService';
import { recalculateProjectEstimates } from './projectController';

export const createSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { taskId, projectId, startTime, endTime, duration, notes, device, breaks } = req.body;

    if (!taskId || !startTime || !endTime || duration === undefined) {
      res.status(400).json({ error: 'Faltan parámetros obligatorios (taskId, startTime, endTime, duration).' });
      return;
    }

    // Save main session
    const session = new TimeSession({
      userId,
      taskId,
      projectId: projectId || undefined,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      notes: notes || '',
      device: device || 'desktop',
    });

    await session.save();

    // Save breaks if any
    let breaksSaved: any[] = [];
    if (breaks && Array.isArray(breaks) && breaks.length > 0) {
      const breakPromises = breaks.map((b) => {
        const newBreak = new Break({
          sessionId: session._id,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
          duration: b.duration,
          type: b.type || 'break',
          notes: b.notes || '',
        });
        return newBreak.save();
      });
      breaksSaved = await Promise.all(breakPromises);
    }

    // Trigger Intelligence Recalculation for the Task
    await StatsService.recalculateTaskStats(taskId);

    // If associated with a project, update the ProjectTask status and duration
    if (projectId) {
      // Find the project task and update it
      const projectTask = await ProjectTask.findOne({ projectId, taskId });
      if (projectTask) {
        projectTask.status = 'completed';
        projectTask.actualDuration += duration;
        await projectTask.save();
      }

      // Recalculate project totals
      await recalculateProjectEstimates(projectId);
    }

    res.status(201).json({
      message: 'Sesión registrada y estadísticas actualizadas con éxito.',
      session,
      breaks: breaksSaved,
    });
  } catch (error) {
    console.error('Error creating time session:', error);
    res.status(500).json({ error: 'Error al guardar la sesión de tiempo.' });
  }
};

export const getSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { taskId, projectId, limit, skip } = req.query;

    const query: any = { userId };
    if (taskId) query.taskId = taskId;
    if (projectId) query.projectId = projectId;

    const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
    const parsedSkip = skip ? parseInt(skip as string, 10) : 0;

    const sessions = await TimeSession.find(query)
      .sort({ createdAt: -1 })
      .skip(parsedSkip)
      .limit(parsedLimit)
      .populate('taskId', 'name color icon category')
      .populate('projectId', 'name color');

    const total = await TimeSession.countDocuments(query);

    res.status(200).json({
      total,
      limit: parsedLimit,
      skip: parsedSkip,
      sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Error al obtener el historial de sesiones.' });
  }
};

export const deleteSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const session = await TimeSession.findOne({ _id: id, userId });
    if (!session) {
      res.status(404).json({ error: 'Sesión no encontrada.' });
      return;
    }

    const { taskId, projectId } = session;

    await TimeSession.deleteOne({ _id: id });
    await Break.deleteMany({ sessionId: id });

    // Recalculate stats since session is deleted
    await StatsService.recalculateTaskStats(taskId.toString());

    if (projectId) {
      // Find and deduct duration from project task
      const projectTask = await ProjectTask.findOne({ projectId, taskId });
      if (projectTask) {
        projectTask.actualDuration = Math.max(0, projectTask.actualDuration - session.duration);
        // If actual duration becomes 0, maybe revert status, or leave as completed. We can leave status but adjust time.
        await projectTask.save();
      }
      await recalculateProjectEstimates(projectId.toString());
    }

    res.status(200).json({ message: 'Sesión eliminada y estadísticas actualizadas.' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Error al eliminar la sesión.' });
  }
};

export const updateSessionNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.userId;

    const session = await TimeSession.findOneAndUpdate(
      { _id: id, userId },
      { $set: { notes } },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ error: 'Sesión no encontrada.' });
      return;
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error updating session notes:', error);
    res.status(500).json({ error: 'Error al actualizar las notas de la sesión.' });
  }
};
