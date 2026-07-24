import { Response } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { WorkSession } from '@modules/workSessions/work-session.model';
import { Project } from '@modules/projects/project.model';
import { Task } from '@modules/tasks/task.model';
import { Break } from '@modules/timer/break.model';
import { Types } from 'mongoose';
import { AuthorizationError } from '@core/errors/classes';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;

    if (!userId) {
      throw new AuthorizationError('No autorizado.');
    }

    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = orgId ? new Types.ObjectId(orgId) : null;

    // Get current dates
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Worked durations (Today, Week, Month, Total)
    const timeRanges = [
      { key: 'today', gte: startOfToday },
      { key: 'week', gte: startOfWeek },
      { key: 'month', gte: startOfMonth },
      { key: 'total', gte: new Date(0) },
    ];

    const stats: Record<string, number> = { today: 0, week: 0, month: 0, total: 0 };

    if (orgObjectId) {
      await Promise.all(
        timeRanges.map(async (range) => {
          const result = await WorkSession.aggregate([
            { $match: { organization: orgObjectId, user: userObjectId, startTime: { $gte: range.gte } } },
            { $group: { _id: null, totalDuration: { $sum: '$duration' } } },
          ]);
          stats[range.key] = result.length > 0 ? result[0].totalDuration : 0;
        })
      );
    }

    // 2. Active projects count
    const activeProjectsCount = orgObjectId
      ? await Project.countDocuments({
          organization: orgObjectId,
          status: { $in: ['PLANNING', 'ACTIVE', 'ON_HOLD'] },
        })
      : 0;

    // 3. Completed tasks count (total execution counts or completed tasks)
    const completedTasksCount = orgObjectId
      ? await Task.countDocuments({
          organization: orgObjectId,
          status: 'DONE',
        })
      : 0;

    // 4. Total executions (just legacy fallback returning task sessions count)
    const totalExecutions = orgObjectId
      ? await WorkSession.countDocuments({ organization: orgObjectId, user: userObjectId, status: 'COMPLETED' })
      : 0;

    // 5. Recent 5 sessions
    const recentSessions = orgObjectId
      ? await WorkSession.find({ organization: orgObjectId, user: userObjectId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('task', 'title color icon category')
      : [];

    // Map recent sessions keys for legacy frontend compatibility (taskId -> task)
    const mappedRecentSessions = recentSessions.map((s: any) => {
      const obj = s.toObject ? s.toObject() : s;
      return {
        ...obj,
        taskId: obj.task,
        projectId: obj.project,
      };
    });

    // 6. Category breakdown (duration per category)
    const categoryBreakdown = orgObjectId
      ? await WorkSession.aggregate([
          { $match: { organization: orgObjectId, user: userObjectId } },
          {
            $group: {
              _id: '$category',
              duration: { $sum: '$duration' },
            },
          },
          { $project: { category: '$_id', duration: 1, color: { $literal: '#7C3AED' }, _id: 0 } },
        ])
      : [];

    res.status(200).json({
      workedTime: stats,
      activeProjectsCount,
      completedTasksCount,
      totalExecutions,
      recentSessions: mappedRecentSessions,
      categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : [{ category: 'General', duration: 0, color: '#7C3AED' }],
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard.' });
  }
};

export const getAnalyticsStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;

    if (!userId || !orgId) {
      throw new AuthorizationError('No autorizado.');
    }

    const userObjectId = new Types.ObjectId(userId);
    const orgObjectId = new Types.ObjectId(orgId);

    // 1. Daily trend (past 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrend = await WorkSession.aggregate([
      { $match: { organization: orgObjectId, user: userObjectId, startTime: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          duration: { $sum: '$duration' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates
    const trendMap = new Map<string, number>();
    dailyTrend.forEach((item: any) => trendMap.set(item._id, item.duration));

    const finalTrend = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(fourteenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      finalTrend.push({
        date: dateStr,
        duration: trendMap.get(dateStr) || 0,
      });
    }

    // 2. Breaks / Dead time analysis (Productivity Ratio)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await WorkSession.find({ organization: orgObjectId, user: userObjectId, startTime: { $gte: thirtyDaysAgo } });
    const sessionIds = sessions.map((s: any) => s._id);

    const breaks = await Break.find({ sessionId: { $in: sessionIds } });

    let totalBreaks = 0;
    let totalDeadTime = 0;

    breaks.forEach((b: any) => {
      if (b.type === 'break') totalBreaks += b.duration;
      if (b.type === 'dead_time') totalDeadTime += b.duration;
    });

    const totalActiveTime = sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);

    // 3. Task ranking (Top 5 tasks by time)
    const taskRanking = await Task.find({ organization: orgObjectId })
      .sort({ totalDuration: -1 })
      .limit(5)
      .select('title totalDuration color category');

    // 4. Project ranking (Top 5 projects by accumulated time)
    const projectRanking = await Project.find({ organization: orgObjectId })
      .sort({ accumulatedDuration: -1 })
      .limit(5)
      .select('name accumulatedDuration color client');

    // 5. Math stats: Median & Mode (based on all user's sessions in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysSessions = await WorkSession.find({ organization: orgObjectId, user: userObjectId, startTime: { $gte: ninetyDaysAgo } }).select('duration');
    const durations = ninetyDaysSessions.map((s: any) => s.duration || 0).sort((a: number, b: number) => a - b);

    // Median
    let median = 0;
    if (durations.length > 0) {
      const half = Math.floor(durations.length / 2);
      median = durations.length % 2 !== 0 ? durations[half] : (durations[half - 1] + durations[half]) / 2;
    }

    // Mode
    let mode = 0;
    if (durations.length > 0) {
      const frequency: Record<number, number> = {};
      let maxFreq = 0;
      durations.forEach((d: number) => {
        frequency[d] = (frequency[d] || 0) + 1;
        if (frequency[d] > maxFreq) {
          maxFreq = frequency[d];
          mode = d;
        }
      });
    }

    res.status(200).json({
      dailyTrend: finalTrend,
      productivity: {
        totalActiveTime,
        totalBreaks,
        totalDeadTime,
        ratio: totalActiveTime > 0 ? Math.round((totalActiveTime / (totalActiveTime + totalBreaks)) * 100) : 100,
      },
      taskRanking,
      projectRanking,
      mathStats: {
        median,
        mode,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas analíticas.' });
  }
};
