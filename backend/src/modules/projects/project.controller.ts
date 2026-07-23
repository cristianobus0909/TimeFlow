import { Response } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { Project } from '@modules/projects/project.model';
import { ProjectTask } from '@modules/tasks/project-task.model';
import { Task } from '@modules/tasks/task.model';
import { TimeSession } from '@modules/timer/time-session.model';

/**
 * Recalculates estimated, accumulated and remaining durations for a project
 */
export const recalculateProjectEstimates = async (projectId: string): Promise<void> => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    // Get all project tasks
    const projectTasks = await ProjectTask.find({ projectId });
    const taskIds = projectTasks.map((pt) => pt.taskId);

    // Get tasks to fetch average durations
    const tasks = await Task.find({ _id: { $in: taskIds } });
    const taskAvgMap = new Map<string, number>();
    tasks.forEach((t) => {
      taskAvgMap.set(t._id.toString(), t.averageDuration);
    });

    // 1. Estimated Duration = Sum of average durations of all tasks in project
    let estimatedDuration = 0;
    projectTasks.forEach((pt) => {
      const avg = taskAvgMap.get(pt.taskId.toString()) || 0;
      estimatedDuration += avg;
    });

    // 2. Accumulated Duration = Sum of all time sessions logged to this project
    const sessions = await TimeSession.find({ projectId });
    const accumulatedDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

    // 3. Remaining Duration = Math.max(0, Estimated - Accumulated)
    const remainingDuration = Math.max(0, estimatedDuration - accumulatedDuration);

    // 4. Completion Percentage
    // (If tasks are marked completed, we can also use that, but time-based is extremely accurate for our SaaS core)
    const completedTasksCount = projectTasks.filter((pt) => pt.status === 'completed').length;
    const totalTasksCount = projectTasks.length;
    const completionPercentage = totalTasksCount > 0 
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

    project.estimatedDuration = estimatedDuration;
    project.accumulatedDuration = accumulatedDuration;
    project.remainingDuration = remainingDuration;
    project.completionPercentage = Math.min(100, completionPercentage);

    await project.save();
  } catch (error) {
    console.error(`Error recalculating project estimates for ${projectId}:`, error);
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status } = req.query;

    const query: any = { userId };
    if (status) query.status = status;

    const projects = await Project.find(query).sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ error: 'Error al obtener proyectos.' });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    // Get sorted list of tasks associated with this project
    const projectTasks = await ProjectTask.find({ projectId: id })
      .sort({ order: 1 })
      .populate('taskId');

    res.status(200).json({
      project,
      tasks: projectTasks,
    });
  } catch (error) {
    console.error('Error getting project details:', error);
    res.status(500).json({ error: 'Error al obtener detalles del proyecto.' });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, color, priority, client, startDate, endDate, notes } = req.body;

    if (!name) {
      res.status(400).json({ error: 'El nombre del proyecto es obligatorio.' });
      return;
    }

    const project = new Project({
      userId,
      name,
      description,
      color,
      priority,
      client,
      startDate,
      endDate,
      notes,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error al crear el proyecto.' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const updates = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    await recalculateProjectEstimates(id as string);
    const updatedProject = await Project.findById(id);

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error al actualizar el proyecto.' });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    await Project.deleteOne({ _id: id });
    // Also remove the task relations
    await ProjectTask.deleteMany({ projectId: id });

    res.status(200).json({ message: 'Proyecto eliminado con éxito.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto.' });
  }
};

export const addTaskToProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { taskId, quantity = 1 } = req.body;
    const userId = req.user?.userId;

    // Verify ownership
    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada.' });
      return;
    }

    // Determine order (append to the end)
    const lastTask = await ProjectTask.findOne({ projectId: id }).sort({ order: -1 });
    let startOrder = lastTask ? lastTask.order + 1 : 0;

    const qty = Math.max(1, parseInt(quantity) || 1);
    const projectTasks = [];

    for (let i = 0; i < qty; i++) {
      projectTasks.push({
        projectId: id,
        taskId,
        order: startOrder + i,
        status: 'pending',
      });
    }

    const createdTasks = await ProjectTask.insertMany(projectTasks);
    await recalculateProjectEstimates(id as string);

    res.status(201).json(createdTasks);
  } catch (error) {
    console.error('Error adding task to project:', error);
    res.status(500).json({ error: 'Error al agregar la tarea al proyecto.' });
  }
};

export const removeTaskFromProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, projectTaskId } = req.params;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    await ProjectTask.deleteOne({ projectId: id, _id: projectTaskId });
    await recalculateProjectEstimates(id as string);

    res.status(200).json({ message: 'Tarea removida del proyecto correctamente.' });
  } catch (error) {
    console.error('Error removing task from project:', error);
    res.status(500).json({ error: 'Error al remover la tarea del proyecto.' });
  }
};

export const reorderProjectTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { taskOrders } = req.body; // Array of { projectTaskId: string, order: number }
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    if (!Array.isArray(taskOrders)) {
      res.status(400).json({ error: 'Formato inválido. Se espera un arreglo taskOrders.' });
      return;
    }

    // Update orders sequentially using projectTaskId (_id)
    await Promise.all(
      taskOrders.map((to) =>
        ProjectTask.updateOne(
          { projectId: id, _id: to.projectTaskId },
          { $set: { order: to.order } }
        )
      )
    );

    res.status(200).json({ message: 'Orden de tareas actualizado correctamente.' });
  } catch (error) {
    console.error('Error reordering project tasks:', error);
    res.status(500).json({ error: 'Error al reordenar las tareas.' });
  }
};

export const toggleProjectTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, projectTaskId } = req.params;
    const { status, actualDuration } = req.body; // status: 'pending' or 'completed'
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, userId });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado.' });
      return;
    }

    const projectTask = await ProjectTask.findOne({ projectId: id, _id: projectTaskId });
    if (!projectTask) {
      res.status(404).json({ error: 'Relación tarea-proyecto no encontrada.' });
      return;
    }

    if (status !== undefined) projectTask.status = status;
    if (actualDuration !== undefined) projectTask.actualDuration = actualDuration;

    await projectTask.save();
    await recalculateProjectEstimates(id as string);

    res.status(200).json(projectTask);
  } catch (error) {
    console.error('Error updating task status inside project:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la tarea en el proyecto.' });
  }
};
