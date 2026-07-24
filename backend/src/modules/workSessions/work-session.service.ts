import { WorkSessionRepository } from './work-session.repository';
import { WorkSession, IWorkSession } from './work-session.model';
import { IDailyGoal } from './daily-goal.model';
import { StartWorkSessionInput, FinishWorkSessionInput, DailyGoalInput } from './work-session.schema';
import { Rate } from '@modules/rates/rate.model';
import { Project } from '@modules/projects/project.model';
import { Task } from '@modules/tasks/task.model';
import { ProjectTask } from '@modules/tasks/project-task.model';
import { ProjectService } from '@modules/projects/project.service';
import { StatsService } from '@modules/analytics/stats.service';
import { NotFoundError, ValidationError, AuthorizationError } from '@core/errors/classes';
import { Types } from 'mongoose';

export class WorkSessionService {
  private repository: WorkSessionRepository;
  private projectService: ProjectService;

  constructor() {
    this.repository = new WorkSessionRepository();
    this.projectService = new ProjectService();
  }

  public async getActiveSession(orgId: string, userId: string): Promise<IWorkSession | null> {
    return this.repository.findActiveSession(orgId, userId);
  }

  public async getHistory(orgId: string, filters: any = {}): Promise<IWorkSession[]> {
    return this.repository.findHistory(orgId, filters);
  }

  public async startSession(data: StartWorkSessionInput, orgId: string, userId: string): Promise<IWorkSession> {
    // 1. Enforce only one running or paused session per user
    const running = await this.repository.findActiveSession(orgId, userId);
    if (running) {
      throw new ValidationError('Ya tiene un cronómetro activo. Por favor, detenga o pause la sesión actual.');
    }

    // 2. Resolve hourly rate hierarchy
    const activeRate = await Rate.findOne({
      organization: new Types.ObjectId(orgId),
      category: Types.ObjectId.isValid(data.category) ? new Types.ObjectId(data.category) : undefined as any,
      complexity: data.complexity,
      active: true,
    });

    let resolvedHourlyRate = 0;
    if (activeRate) {
      resolvedHourlyRate = activeRate.hourlyRate;
    } else if (data.project) {
      const project = await Project.findById(data.project);
      if (project && project.hourlyRate) {
        resolvedHourlyRate = project.hourlyRate;
      }
    }

    // 3. Create the session
    return this.repository.create({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      userId: new Types.ObjectId(userId), // Legacy compatibility
      client: data.client ? new Types.ObjectId(data.client) : undefined,
      project: data.project ? new Types.ObjectId(data.project) : undefined,
      projectId: data.project ? new Types.ObjectId(data.project) : undefined, // Legacy
      task: new Types.ObjectId(data.task),
      taskId: new Types.ObjectId(data.task), // Legacy
      category: Types.ObjectId.isValid(data.category) ? new Types.ObjectId(data.category) : data.category,
      rate: activeRate ? activeRate._id as any : undefined,
      complexity: data.complexity as any,
      startTime: data.startTime || new Date(),
      notes: data.notes,
      device: data.device,
      billable: data.billable,
      hourlyRate: resolvedHourlyRate,
      status: 'RUNNING',
      breaks: [],
      createdBy: new Types.ObjectId(userId),
    });
  }

  public async pauseSession(id: string, orgId: string, userId: string): Promise<IWorkSession> {
    const session = await this.repository.findById(id, orgId);
    if (!session) {
      throw new NotFoundError('Sesión de trabajo no encontrada.');
    }

    if (session.user.toString() !== userId) {
      throw new AuthorizationError('No está autorizado para modificar esta sesión.');
    }

    if (session.status !== 'RUNNING') {
      throw new ValidationError('Solo se pueden pausar sesiones activas.');
    }

    // Push new break segment
    const now = new Date();
    session.breaks.push({
      startTime: now,
      duration: 0,
      type: 'break',
    });
    session.status = 'PAUSED';
    session.updatedBy = new Types.ObjectId(userId);

    return session.save();
  }

  public async resumeSession(id: string, orgId: string, userId: string): Promise<IWorkSession> {
    const session = await this.repository.findById(id, orgId);
    if (!session) {
      throw new NotFoundError('Sesión de trabajo no encontrada.');
    }

    if (session.user.toString() !== userId) {
      throw new AuthorizationError('No está autorizado para modificar esta sesión.');
    }

    if (session.status !== 'PAUSED') {
      throw new ValidationError('Solo se pueden reanudar sesiones pausadas.');
    }

    const now = new Date();
    // Close the open break segment
    const openBreak = session.breaks.find(b => !b.endTime);
    if (openBreak) {
      openBreak.endTime = now;
      openBreak.duration = Math.max(0, Math.round((now.getTime() - openBreak.startTime.getTime()) / 1000));
      session.breakDuration = (session.breakDuration || 0) + openBreak.duration;
    }

    session.status = 'RUNNING';
    session.updatedBy = new Types.ObjectId(userId);

    return session.save();
  }

  public async finishSession(id: string, orgId: string, userId: string, finishData: FinishWorkSessionInput): Promise<IWorkSession> {
    const session = await this.repository.findById(id, orgId);
    if (!session) {
      throw new NotFoundError('Sesión de trabajo no encontrada.');
    }

    if (session.user.toString() !== userId) {
      throw new AuthorizationError('No está autorizado para finalizar esta sesión.');
    }

    if (session.status !== 'RUNNING' && session.status !== 'PAUSED') {
      throw new ValidationError('Solo se pueden finalizar sesiones activas o pausadas.');
    }

    const now = finishData.endTime || new Date();

    // If it was paused, close the last break segment first
    if (session.status === 'PAUSED') {
      const openBreak = session.breaks.find(b => !b.endTime);
      if (openBreak) {
        openBreak.endTime = now;
        openBreak.duration = Math.max(0, Math.round((now.getTime() - openBreak.startTime.getTime()) / 1000));
        session.breakDuration = (session.breakDuration || 0) + openBreak.duration;
      }
    }

    // Double check that there are no open breaks left
    const openBreaks = session.breaks.filter(b => !b.endTime);
    if (openBreaks.length > 0) {
      throw new ValidationError('No se puede finalizar la sesión si existen pausas abiertas.');
    }

    // Calculations
    const duration = Math.max(0, Math.round((now.getTime() - session.startTime.getTime()) / 1000));
    const effectiveDuration = Math.max(0, duration - (session.breakDuration || 0));
    const totalAmount = session.billable !== false
      ? Math.round((effectiveDuration / 3600) * (session.hourlyRate || 0) * 100) / 100
      : 0;

    session.endTime = now;
    session.duration = duration;
    session.effectiveDuration = effectiveDuration;
    session.totalAmount = totalAmount;
    session.status = 'COMPLETED';
    session.isCompleted = true; // Legacy compatibility
    if (finishData.notes !== undefined) session.notes = finishData.notes;
    if (finishData.description !== undefined) session.description = finishData.description;
    session.updatedBy = new Types.ObjectId(userId);

    const saved = await session.save();

    // Trigger statistics recalculations
    await StatsService.recalculateTaskStats(saved.task.toString());
    
    if (saved.project) {
      const projectTask = await ProjectTask.findOne({ projectId: saved.project, taskId: saved.task });
      if (projectTask) {
        projectTask.status = 'completed';
        projectTask.actualDuration = (projectTask.actualDuration || 0) + effectiveDuration;
        await projectTask.save();
      }
      await this.projectService.recalculateProjectEstimates(saved.project.toString());
    }

    return saved;
  }

  public async cancelSession(id: string, orgId: string, userId: string): Promise<IWorkSession> {
    const session = await this.repository.findById(id, orgId);
    if (!session) {
      throw new NotFoundError('Sesión de trabajo no encontrada.');
    }

    if (session.user.toString() !== userId) {
      throw new AuthorizationError('No está autorizado para cancelar esta sesión.');
    }

    if (session.status !== 'RUNNING' && session.status !== 'PAUSED') {
      throw new ValidationError('Solo se pueden cancelar sesiones activas o pausadas.');
    }

    const now = new Date();
    // Close open breaks if any
    if (session.status === 'PAUSED') {
      const openBreak = session.breaks.find(b => !b.endTime);
      if (openBreak) {
        openBreak.endTime = now;
        openBreak.duration = Math.max(0, Math.round((now.getTime() - openBreak.startTime.getTime()) / 1000));
        session.breakDuration = (session.breakDuration || 0) + openBreak.duration;
      }
    }

    session.endTime = now;
    session.status = 'CANCELLED';
    session.updatedBy = new Types.ObjectId(userId);

    return session.save();
  }

  // Daily Goals Management
  public async createOrUpdateDailyGoal(data: DailyGoalInput, orgId: string, userId: string): Promise<IDailyGoal> {
    const targetDate = data.date || new Date();
    const existing = await this.repository.findDailyGoal(orgId, userId, targetDate);

    if (existing) {
      const updated = await this.repository.updateDailyGoal(
        existing._id.toString(),
        {
          targetHours: data.targetHours,
          targetAmount: data.targetAmount,
        },
        userId
      );
      if (!updated) {
        throw new NotFoundError('No se pudo actualizar el objetivo diario.');
      }
      return updated;
    }

    const dateWithoutHours = new Date(targetDate);
    dateWithoutHours.setHours(0, 0, 0, 0);

    return this.repository.createDailyGoal({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      targetHours: data.targetHours,
      targetAmount: data.targetAmount,
      date: dateWithoutHours,
      createdBy: new Types.ObjectId(userId),
    });
  }

  public async getTodayDailyGoal(orgId: string, userId: string): Promise<IDailyGoal | null> {
    return this.repository.findDailyGoal(orgId, userId, new Date());
  }

  // Aggregated Performance Indicators
  public async getIndicators(orgId: string, userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);

    const now = new Date();

    // 1. TODAY Indicators (00:00:00 to 23:59:59 local time boundaries)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaySessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfToday, $lte: endOfToday },
    });

    const todayHours = todaySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 3600;
    const todayEffectiveHours = todaySessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const todayBreakHours = todaySessions.reduce((sum: number, s: any) => sum + (s.breakDuration || 0), 0) / 3600;
    const todayAmount = todaySessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const todayCount = todaySessions.length;

    // 2. WEEKLY Indicators (Last 7 days, starting from Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfWeek },
    });

    const weekHours = weekSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const weekAmount = weekSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const weekDaysCount = Math.max(1, now.getDay() + 1); // count days of current week
    const weekDailyAvgHours = weekHours / weekDaysCount;

    // 3. MONTHLY Indicators (Start of current month to now)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfMonth },
    });

    const monthHours = monthSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const monthAmount = monthSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const monthAvgHourlyRate = monthHours > 0 ? monthAmount / monthHours : 0;

    return {
      today: {
        totalHours: Math.round(todayHours * 100) / 100,
        effectiveHours: Math.round(todayEffectiveHours * 100) / 100,
        breakHours: Math.round(todayBreakHours * 100) / 100,
        amount: Math.round(todayAmount * 100) / 100,
        sessionsCount: todayCount,
      },
      week: {
        totalHours: Math.round(weekHours * 100) / 100,
        amount: Math.round(weekAmount * 100) / 100,
        dailyAverageHours: Math.round(weekDailyAvgHours * 100) / 100,
      },
      month: {
        totalHours: Math.round(monthHours * 100) / 100,
        amount: Math.round(monthAmount * 100) / 100,
        averageHourlyRate: Math.round(monthAvgHourlyRate * 100) / 100,
      },
    };
  }

  public async getSessions(orgId: string, filters: any): Promise<IWorkSession[]> {
    return this.repository.findHistory(orgId, filters);
  }

  public async deleteSession(id: string, orgId: string, userId: string): Promise<void> {
    const session = await this.repository.findById(id, orgId);
    if (!session) {
      throw new NotFoundError('Sesión no encontrada.');
    }
    
    await this.repository.softDelete(id, orgId, userId);

    await StatsService.recalculateTaskStats(session.task.toString());
    if (session.project) {
      await this.projectService.recalculateProjectEstimates(session.project.toString());
    }
  }

  public async updateSession(id: string, orgId: string, data: any, userId: string): Promise<IWorkSession> {
    const updated = await this.repository.update(id, orgId, data, userId);
    if (!updated) {
      throw new NotFoundError('Sesión no encontrada.');
    }
    return updated;
  }

  public async logCompletedSession(data: any, orgId: string, userId: string): Promise<IWorkSession> {
    const activeRate = await Rate.findOne({
      organization: new Types.ObjectId(orgId),
      category: Types.ObjectId.isValid(data.category) ? new Types.ObjectId(data.category) : undefined as any,
      complexity: data.complexity || 'MEDIUM',
      active: true,
    });

    let resolvedHourlyRate = 0;
    if (activeRate) {
      resolvedHourlyRate = activeRate.hourlyRate;
    } else if (data.project) {
      const project = await Project.findById(data.project);
      if (project && project.hourlyRate) {
        resolvedHourlyRate = project.hourlyRate;
      }
    }

    const duration = data.duration || 0;
    const breakDuration = data.breakDuration || 0;
    const effectiveDuration = Math.max(0, duration - breakDuration);
    const totalAmount = data.billable !== false
      ? Math.round((effectiveDuration / 3600) * resolvedHourlyRate * 100) / 100
      : 0;

    const session = await this.repository.create({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      userId: new Types.ObjectId(userId),
      client: data.client ? new Types.ObjectId(data.client) : undefined,
      project: data.project ? new Types.ObjectId(data.project) : undefined,
      projectId: data.project ? new Types.ObjectId(data.project) : undefined,
      task: new Types.ObjectId(data.task),
      taskId: new Types.ObjectId(data.task),
      category: Types.ObjectId.isValid(data.category) ? new Types.ObjectId(data.category) : data.category,
      rate: activeRate ? activeRate._id as any : undefined,
      complexity: data.complexity || 'MEDIUM',
      startTime: data.startTime || new Date(),
      endTime: data.endTime || new Date(),
      duration,
      breakDuration,
      effectiveDuration,
      billable: data.billable !== false,
      hourlyRate: resolvedHourlyRate,
      totalAmount,
      status: 'COMPLETED',
      isCompleted: true,
      notes: data.notes,
      device: data.device || 'desktop',
      createdBy: new Types.ObjectId(userId),
    });

    await StatsService.recalculateTaskStats(session.task.toString());
    if (session.project) {
      const projectTask = await ProjectTask.findOne({ projectId: session.project, taskId: session.task });
      if (projectTask) {
        projectTask.status = 'completed';
        projectTask.actualDuration = (projectTask.actualDuration || 0) + effectiveDuration;
        await projectTask.save();
      }
      await this.projectService.recalculateProjectEstimates(session.project.toString());
    }

    return session;
  }
}
export default WorkSessionService;
