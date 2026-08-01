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
import { Settings } from '@modules/settings/settings.model';

const extractId = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'object') {
    if (val._id) return val._id.toString();
    if (val.id) return val.id.toString();
  }
  return val.toString();
};

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

  public async resolveHourlyRate(
    orgId: string,
    categoryId?: any,
    complexity?: string,
    projectId?: any
  ): Promise<number> {
    // 1. Try finding by Category ObjectId & Complexity
    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      const rate = await Rate.findOne({
        organization: new Types.ObjectId(orgId),
        category: new Types.ObjectId(categoryId),
        complexity: complexity || 'MEDIUM',
        active: true,
      });
      if (rate && rate.hourlyRate > 0) return rate.hourlyRate;
    }

    // 2. Try finding by Category Name string matching
    if (categoryId && typeof categoryId === 'string') {
      try {
        const { Category } = await import('../timer/category.model.js');
        const catDoc = await Category.findOne({
          name: new RegExp(`^${categoryId}$`, 'i'),
        });
        if (catDoc) {
          const rate = await Rate.findOne({
            organization: new Types.ObjectId(orgId),
            category: catDoc._id,
            active: true,
          });
          if (rate && rate.hourlyRate > 0) return rate.hourlyRate;
        }
      } catch (e) {
        // ignore lookup error
      }
    }

    // 3. Try finding Project's hourlyRate
    if (projectId) {
      const project = await Project.findOne({
        _id: Types.ObjectId.isValid(projectId) ? new Types.ObjectId(projectId) : projectId,
        organization: orgId,
      });
      if (project && project.hourlyRate && project.hourlyRate > 0) {
        return project.hourlyRate;
      }
    }

    // 4. Try finding ANY active Rate in the organization
    const anyOrgRate = await Rate.findOne({
      organization: new Types.ObjectId(orgId),
      active: true,
    }).sort({ hourlyRate: -1 });
    if (anyOrgRate && anyOrgRate.hourlyRate > 0) {
      return anyOrgRate.hourlyRate;
    }

    // 5. Try finding user/organization defaultHourlyRate from settings
    try {
      const userSettings = await Settings.findOne({ userId: new Types.ObjectId(orgId) });
      if (userSettings && (userSettings as any).defaultHourlyRate && (userSettings as any).defaultHourlyRate > 0) {
        return (userSettings as any).defaultHourlyRate;
      }
    } catch (e) {}

    // Fallback default hourly rate for SaaS workspace (25.00 €/h)
    return 25.0;
  }

  public async startSession(data: StartWorkSessionInput, orgId: string, userId: string): Promise<IWorkSession> {
    // 1. Enforce only one running or paused session per user
    const running = await this.repository.findActiveSession(orgId, userId);
    if (running) {
      throw new ValidationError('Ya tiene un cronómetro activo. Por favor, detenga o pause la sesión actual.');
    }

    // 2. Resolve hourly rate hierarchy
    const resolvedHourlyRate = await this.resolveHourlyRate(orgId, data.category, data.complexity, data.project);

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

    if (session.user.toString() !== userId && extractId(session.user) !== userId) {
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

    if (session.user.toString() !== userId && extractId(session.user) !== userId) {
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

    if (session.user.toString() !== userId && extractId(session.user) !== userId) {
      throw new AuthorizationError('No está autorizado para finalizar esta sesión.');
    }

    if (session.status !== 'RUNNING' && session.status !== 'PAUSED') {
      throw new ValidationError('Solo se pueden finalizar sesiones activas o pausadas.');
    }

    const now = finishData.endTime || new Date();

    // Auto-close any open break segments
    session.breaks.forEach(b => {
      if (!b.endTime) {
        b.endTime = now;
        b.duration = Math.max(0, Math.round((now.getTime() - new Date(b.startTime).getTime()) / 1000));
        session.breakDuration = (session.breakDuration || 0) + b.duration;
      }
    });

    // Calculations
    const duration = Math.max(0, Math.round((now.getTime() - session.startTime.getTime()) / 1000));
    const effectiveDuration = Math.max(0, duration - (session.breakDuration || 0));

    const resolvedRate = session.hourlyRate && session.hourlyRate > 0
      ? session.hourlyRate
      : await this.resolveHourlyRate(orgId, session.category, session.complexity, session.project);

    const totalAmount = session.billable !== false
      ? Math.round((effectiveDuration / 3600) * resolvedRate * 100) / 100
      : 0;

    session.endTime = now;
    session.duration = duration;
    session.effectiveDuration = effectiveDuration;
    session.hourlyRate = resolvedRate;
    session.totalAmount = totalAmount;
    session.status = 'COMPLETED';
    session.isCompleted = true; // Legacy compatibility
    if (finishData.notes !== undefined) session.notes = finishData.notes;
    if (finishData.description !== undefined) session.description = finishData.description;
    session.updatedBy = new Types.ObjectId(userId);

    const saved = await session.save();

    // Trigger statistics recalculations with safely extracted string IDs
    const taskIdStr = extractId(saved.task);
    if (taskIdStr) {
      await StatsService.recalculateTaskStats(taskIdStr);
    }
    
    const projIdStr = extractId(saved.project);
    if (projIdStr) {
      const projectTask = await ProjectTask.findOne({ projectId: projIdStr, taskId: taskIdStr });
      if (projectTask) {
        projectTask.status = 'completed';
        projectTask.actualDuration = (projectTask.actualDuration || 0) + effectiveDuration;
        await projectTask.save();
      }
      await this.projectService.recalculateProjectEstimates(projIdStr);
    }

    return saved;
  }

  public async cancelSession(id: string, orgId: string, userId: string): Promise<IWorkSession> {
    const session = await this.repository.findById(id, orgId);
    if (!session) {
      throw new NotFoundError('Sesión de trabajo no encontrada.');
    }

    if (session.user.toString() !== userId && extractId(session.user) !== userId) {
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
      isDeleted: { $ne: true },
      startTime: { $gte: startOfToday, $lte: endOfToday },
    });

    const calcSessionAmount = (s: any) => {
      if (s.billable === false) return 0;
      if (s.totalAmount && s.totalAmount > 0) return s.totalAmount;
      const rate = s.hourlyRate && s.hourlyRate > 0 ? s.hourlyRate : 25;
      const durationHours = (s.effectiveDuration || s.duration || 0) / 3600;
      return Math.round(durationHours * rate * 100) / 100;
    };

    const todayHours = todaySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 3600;
    const todayEffectiveHours = todaySessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const todayBreakHours = todaySessions.reduce((sum: number, s: any) => sum + (s.breakDuration || 0), 0) / 3600;
    const todayAmount = todaySessions.reduce((sum: number, s: any) => sum + calcSessionAmount(s), 0);
    const todayCount = todaySessions.length;

    // 2. WEEKLY Indicators (Last 7 days, starting from Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      isDeleted: { $ne: true },
      startTime: { $gte: startOfWeek },
    });

    const weekHours = weekSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const weekAmount = weekSessions.reduce((sum: number, s: any) => sum + calcSessionAmount(s), 0);
    const weekDaysCount = Math.max(1, now.getDay() + 1); // count days of current week
    const weekDailyAvgHours = weekHours / weekDaysCount;

    // 3. MONTHLY Indicators (Start of current month to now)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      isDeleted: { $ne: true },
      startTime: { $gte: startOfMonth },
    });

    const monthHours = monthSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const monthAmount = monthSessions.reduce((sum: number, s: any) => sum + calcSessionAmount(s), 0);
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

    const taskIdStr = extractId(session.task);
    if (taskIdStr) {
      await StatsService.recalculateTaskStats(taskIdStr);
    }
    
    const projIdStr = extractId(session.project);
    if (projIdStr) {
      await this.projectService.recalculateProjectEstimates(projIdStr);
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
    const resolvedHourlyRate = await this.resolveHourlyRate(orgId, data.category, data.complexity, data.project);

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

    const taskIdStr = extractId(session.task);
    if (taskIdStr) {
      await StatsService.recalculateTaskStats(taskIdStr);
    }
    
    const projIdStr = extractId(session.project);
    if (projIdStr) {
      const projectTask = await ProjectTask.findOne({ projectId: projIdStr, taskId: taskIdStr });
      if (projectTask) {
        projectTask.status = 'completed';
        projectTask.actualDuration = (projectTask.actualDuration || 0) + effectiveDuration;
        await projectTask.save();
      }
      await this.projectService.recalculateProjectEstimates(projIdStr);
    }

    return session;
  }
}
export default WorkSessionService;
