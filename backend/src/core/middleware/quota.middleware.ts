import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { User } from '@modules/users/user.model';
import { Project } from '@modules/projects/project.model';
import { Task } from '@modules/tasks/task.model';

export const checkProjectLimit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // Pro plans have no project limits
    if (user.subscriptionPlan === 'pro' && user.subscriptionStatus === 'active') {
      return next();
    }

    // Free users can have at most 3 active/planning/paused projects (archived or completed do not count, or just total count)
    // Let's count non-completed/non-archived projects or total projects. Total projects is standard for Free plan.
    const projectCount = await Project.countDocuments({
      userId,
      status: { $ne: 'completed' }, // completed projects don't count towards active limit
    });

    if (projectCount >= 3) {
      res.status(403).json({
        error: 'Límite de proyectos alcanzado (Límite: 3 proyectos activos).',
        quotaExceeded: true,
        code: 'LIMIT_PROJECTS',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking project quota:', error);
    res.status(500).json({ error: 'Error al verificar cuota de proyectos.' });
  }
};

export const checkTaskLimit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // Pro plans have no task limits
    if (user.subscriptionPlan === 'pro' && user.subscriptionStatus === 'active') {
      return next();
    }

    // Free users can have at most 15 active tasks
    const taskCount = await Task.countDocuments({ userId, status: 'active' });

    if (taskCount >= 15) {
      res.status(403).json({
        error: 'Límite de tareas alcanzado (Límite: 15 tareas activas).',
        quotaExceeded: true,
        code: 'LIMIT_TASKS',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking task quota:', error);
    res.status(500).json({ error: 'Error al verificar cuota de tareas.' });
  }
};
