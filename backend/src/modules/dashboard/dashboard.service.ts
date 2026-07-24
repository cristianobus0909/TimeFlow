import { WorkSession } from '@modules/workSessions/work-session.model';
import { DailyGoal } from '@modules/workSessions/daily-goal.model';
import { Project } from '@modules/projects/project.model';
import { Client } from '@modules/clients/client.model';
import { Task } from '@modules/tasks/task.model';
import { Types } from 'mongoose';

export class DashboardService {
  public async getOverview(orgId: string, userId: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);
    const now = new Date();

    // 1. Fetch Today Completed Sessions (00:00:00 to 23:59:59 local boundaries)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaySessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfToday, $lte: endOfToday },
    }).populate('project').populate('task');

    const todayHours = todaySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 3600;
    const todayEffectiveHours = todaySessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const todayBreakHours = todaySessions.reduce((sum: number, s: any) => sum + (s.breakDuration || 0), 0) / 3600;
    const todayAmount = todaySessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
    const todayCount = todaySessions.length;

    // 2. Fetch Active Session
    const activeSession = await WorkSession.findOne({
      organization: orgObjectId,
      user: userObjectId,
      status: { $in: ['RUNNING', 'PAUSED'] },
    }).populate('project').populate('task').populate('client');

    // 3. Fetch Today's Daily Goal
    const dailyGoal = await DailyGoal.findOne({
      organization: orgObjectId,
      user: userObjectId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    // 4. Calculate Earnings totals (Today, Week, Month)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfWeek },
    });
    const weekAmount = weekSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

    const monthSessions = await WorkSession.find({
      organization: orgObjectId,
      user: userObjectId,
      status: 'COMPLETED',
      startTime: { $gte: startOfMonth },
    });
    const monthAmount = monthSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

    // 5. Category/Productivity Breakdown for Today
    const categoryBreakdownMap = new Map<string, { duration: number; name: string }>();
    todaySessions.forEach((s: any) => {
      const categoryName = s.task?.category || s.category || 'General';
      const key = String(categoryName);
      const existing = categoryBreakdownMap.get(key) || { duration: 0, name: key };
      existing.duration += s.effectiveDuration || 0;
      categoryBreakdownMap.set(key, existing);
    });
    const productivityList = Array.from(categoryBreakdownMap.values()).map(item => ({
      category: item.name,
      hours: Math.round((item.duration / 3600) * 10) / 10,
    }));

    // 6. Recommendation Engine (Rule-based)
    let recommendation: any = {
      action: 'Registrar nueva sesión',
      title: 'Inicia tu primer cronómetro',
      subtitle: 'Comienza a monitorear horas efectivas en tus tareas asignadas.',
      type: 'general',
    };

    const criticalTask = await Task.findOne({
      organization: orgObjectId,
      assignedTo: userObjectId,
      status: { $in: ['TODO', 'IN_PROGRESS'] },
      priority: { $in: ['HIGH', 'CRITICAL'] as any },
    }).populate('project');

    if (criticalTask) {
      recommendation = {
        action: 'Finalizar tarea crítica',
        title: criticalTask.title,
        subtitle: `Proyecto: ${(criticalTask.project as any)?.name || 'General'} • Prioridad: ${criticalTask.priority}`,
        type: 'task',
        targetId: criticalTask._id,
      };
    } else {
      const activeProject = await Project.findOne({
        organization: orgObjectId,
        status: 'ACTIVE',
      });
      if (activeProject) {
        recommendation = {
          action: 'Continuar proyecto',
          title: activeProject.name,
          subtitle: `Horas presupuestadas: ${activeProject.budgetHours || 0}h`,
          type: 'project',
          targetId: activeProject._id,
        };
      }
    }

    // 7. Top Projects of the Organization
    const activeProjects = await Project.find({
      organization: orgObjectId,
      status: 'ACTIVE',
    }).sort({ priority: -1, createdAt: 1 }).limit(5);

    const projectList = [];
    for (const proj of activeProjects) {
      const projSessions = await WorkSession.find({
        project: proj._id,
        status: 'COMPLETED',
      });
      const hoursUsed = projSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
      const budget = proj.budgetHours || 0;
      const hoursAvailable = Math.max(0, budget - hoursUsed);
      const totalAmount = projSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      projectList.push({
        _id: proj._id,
        name: proj.name,
        color: proj.color || '#7C3AED',
        status: proj.status,
        hoursUsed: Math.round(hoursUsed * 10) / 10,
        hoursAvailable: Math.round(hoursAvailable * 10) / 10,
        profitability: Math.round(totalAmount * 100) / 100,
      });
    }

    // 8. Clients ranked by total billing amount
    const clients = await Client.find({ organization: orgObjectId }).limit(5);
    const clientList = [];
    for (const client of clients) {
      const clientSessions = await WorkSession.find({
        client: client._id,
        status: 'COMPLETED',
      });
      const amount = clientSessions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      clientList.push({
        _id: client._id,
        name: client.name,
        amount: Math.round(amount * 100) / 100,
        rating: amount > 800 ? 5 : amount > 300 ? 4 : 3,
      });
    }
    clientList.sort((a, b) => b.amount - a.amount);

    // 9. Alerts collector (Max 5 warnings)
    const alerts: string[] = [];
    if (todayEffectiveHours === 0) {
      alerts.push('No has registrado horas de trabajo hoy. ¡Inicia una sesión!');
    }

    if (activeSession && activeSession.status === 'PAUSED') {
      const lastBreak = activeSession.breaks[activeSession.breaks.length - 1];
      if (lastBreak && !lastBreak.endTime) {
        const breakMs = Date.now() - new Date(lastBreak.startTime).getTime();
        if (breakMs > 3600000) {
          alerts.push('La sesión de trabajo lleva pausada más de una hora.');
        }
      }
    }

    // Check project budget alerts
    for (const proj of activeProjects) {
      const projSessions = await WorkSession.find({
        project: proj._id,
        status: 'COMPLETED',
      });
      const hoursUsed = projSessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
      const budget = proj.budgetHours || 0;
      if (budget > 0 && (hoursUsed / budget) >= 0.9) {
        alerts.push(`El proyecto "${proj.name}" ha consumido más del 90% de las horas presupuestadas.`);
      }
    }

    // 10. Productivity Coach Advice (Rule-based)
    let coachAdvice = '¡Excelente ritmo de trabajo hoy! Sigue concentrado y descansa a intervalos regulares.';
    if (todayEffectiveHours < 1) {
      coachAdvice = 'Tu objetivo diario aún no ha comenzado. ¡Inicia un cronómetro para arrancar la jornada!';
    } else {
      const adminDuration = todaySessions
        .filter((s: any) => String(s.task?.category || s.category).toLowerCase().includes('admin'))
        .reduce((sum: number, s: any) => sum + s.effectiveDuration, 0);
      const totalDuration = todaySessions.reduce((sum: number, s: any) => sum + s.effectiveDuration, 0);
      if (totalDuration > 0 && (adminDuration / totalDuration) > 0.3) {
        coachAdvice = 'Hoy has invertido demasiado tiempo en tareas administrativas. Intenta delegar o programarlas para el final del día.';
      }
    }

    // 11. Logros (Achievements)
    let achievement = {
      title: 'Primer cliente premium',
      description: '¡Sigue sumando horas para desbloquear nuevas insignias!',
    };
    if (monthAmount > 1000) {
      achievement = {
        title: 'Mejor mes del año',
        description: '¡Has superado los 1000 EUR generados este mes! Sigue así.',
      };
    } else if (todayEffectiveHours >= 8) {
      achievement = {
        title: 'Jornada impecable',
        description: 'Has trabajado más de 8 horas efectivas hoy.',
      };
    }

    return {
      today: {
        totalHours: Math.round(todayHours * 100) / 100,
        effectiveHours: Math.round(todayEffectiveHours * 100) / 100,
        breakHours: Math.round(todayBreakHours * 100) / 100,
        amount: Math.round(todayAmount * 100) / 100,
        sessionsCount: todayCount,
      },
      currentSession: activeSession ? {
        _id: activeSession._id,
        status: activeSession.status,
        startTime: activeSession.startTime,
        breaks: activeSession.breaks,
        taskName: (activeSession.task as any)?.title || 'Sesión de trabajo',
        projectName: (activeSession.project as any)?.name || 'Sin Proyecto',
        projectColor: (activeSession.project as any)?.color || '#7C3AED',
        clientName: (activeSession.client as any)?.name || 'Sin Cliente',
        hourlyRate: activeSession.hourlyRate || 0,
        totalAmount: activeSession.totalAmount || 0,
      } : null,
      dailyGoal: dailyGoal ? {
        targetHours: dailyGoal.targetHours,
        targetAmount: dailyGoal.targetAmount,
      } : null,
      recommendation,
      productivity: productivityList,
      money: {
        today: Math.round(todayAmount * 100) / 100,
        week: Math.round(weekAmount * 100) / 100,
        month: Math.round(monthAmount * 100) / 100,
      },
      projects: projectList,
      clients: clientList,
      alerts: alerts.slice(0, 5),
      coach: coachAdvice,
      achievements: achievement,
    };
  }
}
export default DashboardService;
