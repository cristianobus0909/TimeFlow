import { Response } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { Task } from '@modules/tasks/task.model';
import { TimeSession } from '@modules/timer/time-session.model';
import { StatsService } from '@modules/analytics/stats.service';

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, favorite, category } = req.query;

    const query: any = { userId };
    if (status) query.status = status;
    if (favorite) query.favorite = favorite === 'true';
    if (category) query.category = category;

    const tasks = await Task.find(query).sort({ favorite: -1, name: 1 });

    // Attach confidence level dynamically
    const tasksWithConfidence = await Promise.all(
      tasks.map(async (task) => {
        const sessions = await TimeSession.find({ taskId: task._id }).select('duration');
        const durations = sessions.map((s) => s.duration);
        const confidenceLevel = StatsService.calculateConfidence(durations, task.averageDuration);
        
        return {
          ...task.toObject(),
          confidenceLevel,
        };
      })
    );

    res.status(200).json(tasksWithConfidence);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error al obtener las tareas.' });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada.' });
      return;
    }

    const sessions = await TimeSession.find({ taskId: task._id }).select('duration');
    const durations = sessions.map((s) => s.duration);
    const confidenceLevel = StatsService.calculateConfidence(durations, task.averageDuration);

    res.status(200).json({
      ...task.toObject(),
      confidenceLevel,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Error al obtener la tarea.' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, category, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ error: 'El nombre de la tarea es obligatorio.' });
      return;
    }

    const task = new Task({
      userId,
      name,
      description,
      category,
      color,
      icon,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Error al crear la tarea.' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { name, description, category, color, icon, favorite, status } = req.body;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada.' });
      return;
    }

    if (name !== undefined) task.name = name;
    if (description !== undefined) task.description = description;
    if (category !== undefined) task.category = category;
    if (color !== undefined) task.color = color;
    if (icon !== undefined) task.icon = icon;
    if (favorite !== undefined) task.favorite = favorite;
    if (status !== undefined) task.status = status;

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Error al actualizar la tarea.' });
  }
};

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada.' });
      return;
    }

    task.favorite = !task.favorite;
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Error al alternar favorito.' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada.' });
      return;
    }

    // Instead of deleting, we change status to archived if there are executions,
    // to preserve historical time session data
    if (task.executionCount > 0) {
      task.status = 'archived';
      await task.save();
      res.status(200).json({ message: 'Tarea archivada correctamente para preservar su historial.', task });
    } else {
      await Task.deleteOne({ _id: id });
      res.status(200).json({ message: 'Tarea eliminada correctamente.' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea.' });
  }
};
