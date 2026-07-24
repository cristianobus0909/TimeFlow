import { WorkSession } from '@modules/workSessions/work-session.model';
import { Goal } from './goal.model';
import { UserStreak } from './streak.model';
import { Project } from '@modules/projects/project.model';
import { Client } from '@modules/clients/client.model';
import { Task } from '@modules/tasks/task.model';
import { Types } from 'mongoose';
import { NotFoundError } from '@core/errors/classes';

export class FocusService {
  /**
   * Returns a complete overview of the Focus Mode
   */
  public async getFocusOverview(orgId: string, userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);
    const now = new Date();

    // Local today date boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Fetch active session (RUNNING or PAUSED)
    const activeSession = await WorkSession.findOne({
      organization: orgObjectId,
      user: userObjectId,
      status: { $in: ['RUNNING', 'PAUSED'] },
    }).populate('project').populate('task').populate('client');

    // 2. Fetch completed sessions today
    const todaySessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfToday, $lte: endOfToday },
    }).populate('project').populate('task');

    const todayEffectiveHours = todaySessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const todayAmount = todaySessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const todaySessionsCount = todaySessions.length;
    const todayBreakHours = todaySessions.reduce((sum: number, s: any) => sum + (s.breakDuration || 0), 0) / 3600;
    const totalPausesCount = todaySessions.reduce((sum: number, s: any) => sum + (s.breaks?.length || 0), 0);

    // 3. Fetch goals
    const todayGoal = await Goal.findOne({
      organization: orgObjectId,
      user: userObjectId,
      period: 'DAILY',
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    const targetHours = todayGoal?.targetHours || 8;
    const targetAmount = todayGoal?.targetAmount || 200;
    const targetSessions = todayGoal?.targetSessions || 4;

    // 4. Calculate Scores
    // Productivity Score (0-100)
    const hoursPct = targetHours > 0 ? Math.min(100, (todayEffectiveHours / targetHours) * 100) : 0;
    const sessionsScore = targetSessions > 0 ? Math.min(100, (todaySessionsCount / targetSessions) * 100) : 0;
    const breakPenalty = totalPausesCount * 5;
    const productivityScore = Math.max(0, Math.min(100, Math.round((hoursPct * 0.6) + (sessionsScore * 0.4) - breakPenalty)));

    // Focus Score (1-5 stars)
    let focusScore = 5;
    if (totalPausesCount === 1) focusScore = 4;
    else if (totalPausesCount === 2) focusScore = 3;
    else if (totalPausesCount === 3) focusScore = 2;
    else if (totalPausesCount >= 4) focusScore = 1;

    // Profit Score (hourly rate compared to historical)
    const allCompletedSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
    });
    const totalHistHours = allCompletedSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const totalHistAmount = allCompletedSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const avgHistHourlyRate = totalHistHours > 0 ? totalHistAmount / totalHistHours : 50;

    const todayHourlyRate = todayEffectiveHours > 0 ? todayAmount / todayEffectiveHours : 0;
    const profitScorePercent = avgHistHourlyRate > 0 ? Math.round(((todayHourlyRate - avgHistHourlyRate) / avgHistHourlyRate) * 100) : 0;

    // 5. Build Timeline events
    const timelineEvents: any[] = [];
    todaySessions.forEach((s: any) => {
      // Session Start
      timelineEvents.push({
        time: s.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTime: s.startTime.getTime(),
        event: 'Inicio',
        detail: `Comenzó sesión de "${(s.task as any)?.title || 'Tarea'}"`,
      });

      // Breaks
      if (s.breaks && s.breaks.length > 0) {
        s.breaks.forEach((b: any) => {
          timelineEvents.push({
            time: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawTime: new Date(b.startTime).getTime(),
            event: 'Pausa',
            detail: 'Pausa de descanso',
          });
          if (b.endTime) {
            timelineEvents.push({
              time: new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              rawTime: new Date(b.endTime).getTime(),
              event: 'Continuación',
              detail: 'Sesión reanudada',
            });
          }
        });
      }

      // Session Finish
      if (s.endTime) {
        timelineEvents.push({
          time: s.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: s.endTime.getTime(),
          event: 'Finalización',
          detail: `Sesión finalizada • Duración: ${Math.round((s.effectiveDuration || 0) / 60)} min`,
        });
      }
    });

    // Add active session to timeline if running
    if (activeSession) {
      timelineEvents.push({
        time: activeSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTime: activeSession.startTime.getTime(),
        event: 'Inicio',
        detail: `Corriendo: "${(activeSession.task as any)?.title || 'Tarea'}"`,
      });
      if (activeSession.breaks && activeSession.breaks.length > 0) {
        activeSession.breaks.forEach((b: any) => {
          timelineEvents.push({
            time: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            rawTime: new Date(b.startTime).getTime(),
            event: 'Pausa',
            detail: 'Pausa de descanso activa',
          });
          if (b.endTime) {
            timelineEvents.push({
              time: new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              rawTime: new Date(b.endTime).getTime(),
              event: 'Continuación',
              detail: 'Sesión reanudada',
            });
          }
        });
      }
    }

    timelineEvents.sort((a, b) => a.rawTime - b.rawTime);

    // 6. Productivity Coach Advice
    let coach = 'Mantén tu enfoque hoy. Haz descansos breves cada 90 minutos.';
    if (todayEffectiveHours >= targetHours) {
      coach = '¡Objetivo de horas cumplido! Excelente jornada laboral hoy.';
    } else if (todayBreakHours > 1.5) {
      coach = 'Has tomado descansos largos hoy. Intenta centrarte en bloques continuos de 90 minutos.';
    }

    // 7. Break reminders
    let breaksAlert = null;
    if (activeSession && activeSession.status === 'RUNNING') {
      const lastActionTime = activeSession.breaks.length > 0 
        ? new Date(activeSession.breaks[activeSession.breaks.length - 1].endTime || activeSession.startTime).getTime()
        : activeSession.startTime.getTime();
      const elapsedMs = Date.now() - lastActionTime;
      if (elapsedMs >= 90 * 60 * 1000) {
        breaksAlert = 'Llevas trabajando más de 90 minutos seguidos sin descanso. Es aconsejable tomar un respiro de 5 minutos.';
      }
    }

    return {
      currentSession: activeSession ? {
        _id: activeSession._id,
        status: activeSession.status,
        startTime: activeSession.startTime,
        breaks: activeSession.breaks,
        taskName: (activeSession.task as any)?.title || 'Tarea',
        projectName: (activeSession.project as any)?.name || 'Sin Proyecto',
        clientName: (activeSession.client as any)?.name || 'Sin Cliente',
        hourlyRate: activeSession.hourlyRate || 0,
        totalAmount: activeSession.totalAmount || 0,
      } : null,
      dailyProgress: {
        hours: { target: targetHours, achieved: Math.round(todayEffectiveHours * 100) / 100 },
        amount: { target: targetAmount, achieved: Math.round(todayAmount * 100) / 100 },
        sessions: { target: targetSessions, achieved: todaySessionsCount },
      },
      productivityScore,
      focusScore,
      profitScore: {
        percentChange: profitScorePercent,
        todayRate: Math.round(todayHourlyRate * 100) / 100,
        avgRate: Math.round(avgHistHourlyRate * 100) / 100,
      },
      timeline: timelineEvents.map(e => ({ time: e.time, event: e.event, detail: e.detail })),
      coach,
      breaksAlert,
    };
  }

  /**
   * Returns goals for daily, weekly, and monthly periods
   */
  public async getGoals(orgId: string, userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const daily = await Goal.findOne({ organization: orgObjectId, user: userObjectId, period: 'DAILY', date: { $gte: startOfToday } });
    const weekly = await Goal.findOne({ organization: orgObjectId, user: userObjectId, period: 'WEEKLY', date: { $gte: startOfWeek } });
    const monthly = await Goal.findOne({ organization: orgObjectId, user: userObjectId, period: 'MONTHLY', date: { $gte: startOfMonth } });

    return {
      daily: daily || { period: 'DAILY', targetHours: 8, targetAmount: 200, targetSessions: 4, targetTasks: 3 },
      weekly: weekly || { period: 'WEEKLY', targetHours: 40, targetAmount: 1000, targetSessions: 20, targetTasks: 15 },
      monthly: monthly || { period: 'MONTHLY', targetHours: 160, targetAmount: 4000, targetSessions: 80, targetTasks: 60 },
    };
  }

  /**
   * Sets (create or update) a goal record
   */
  public async setGoal(orgId: string, userId: string, data: any): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);
    const now = new Date();

    let refDate = new Date();
    if (data.period === 'DAILY') {
      refDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (data.period === 'WEEKLY') {
      refDate = new Date(now);
      refDate.setDate(now.getDate() - now.getDay());
      refDate.setHours(0, 0, 0, 0);
    } else if (data.period === 'MONTHLY') {
      refDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const updated = await Goal.findOneAndUpdate(
      {
        organization: orgObjectId,
        user: userObjectId,
        period: data.period,
        date: refDate,
      },
      {
        targetHours: data.targetHours,
        targetAmount: data.targetAmount,
        targetSessions: data.targetSessions || 0,
        targetTasks: data.targetTasks || 0,
      },
      { upsert: true, new: true }
    );

    // Also update UserStreak in background if the daily target is reached
    if (data.period === 'DAILY') {
      await this.updateStreak(orgId, userId);
    }

    return updated;
  }

  /**
   * Retrieves the user streak record
   */
  public async getStreak(orgId: string, userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);

    let streak = await UserStreak.findOne({ organization: orgObjectId, user: userObjectId });
    if (!streak) {
      streak = await UserStreak.create({
        organization: orgObjectId,
        user: userObjectId,
        currentStreak: 0,
        bestStreak: 0,
        lastCompletedDay: null,
      });
    }
    return streak;
  }

  /**
   * Updates user streak based on daily goal completion
   */
  public async updateStreak(orgId: string, userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Fetch today's goal
    const goal = await Goal.findOne({
      organization: orgObjectId,
      user: userObjectId,
      period: 'DAILY',
      date: { $gte: startOfToday },
    });

    if (!goal) return;

    // Fetch today's effective hours
    const todaySessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfToday },
    });
    const effectiveHours = todaySessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;

    // If goal is reached
    if (effectiveHours >= goal.targetHours) {
      let streak = await UserStreak.findOne({ organization: orgObjectId, user: userObjectId });
      if (!streak) {
        streak = new UserStreak({
          organization: orgObjectId,
          user: userObjectId,
          currentStreak: 0,
          bestStreak: 0,
          lastCompletedDay: null,
        });
      }

      const lastDay = streak.lastCompletedDay;
      if (lastDay) {
        const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
        if (lastDayStart.getTime() === startOfYesterday.getTime()) {
          streak.currentStreak += 1;
        } else if (lastDayStart.getTime() !== startOfToday.getTime()) {
          streak.currentStreak = 1;
        }
      } else {
        streak.currentStreak = 1;
      }

      streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
      streak.lastCompletedDay = startOfToday;
      await streak.save();
      return streak;
    }
  }
}
export default FocusService;
