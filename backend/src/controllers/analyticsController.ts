import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TimeSession } from '../models/TimeSession';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Break } from '../models/Break';
import { Types } from 'mongoose';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);

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

    await Promise.all(
      timeRanges.map(async (range) => {
        const result = await TimeSession.aggregate([
          { $match: { userId: userObjectId, startTime: { $gte: range.gte } } },
          { $group: { _id: null, totalDuration: { $sum: '$duration' } } },
        ]);
        stats[range.key] = result.length > 0 ? result[0].totalDuration : 0;
      })
    );

    // 2. Active projects count
    const activeProjectsCount = await Project.countDocuments({
      userId,
      status: { $in: ['in_progress', 'planning'] },
    });

    // 3. Completed tasks count (total execution counts or completed tasks)
    const completedTasksCount = await Task.countDocuments({
      userId,
      executionCount: { $gt: 0 },
    });

    // 4. Total executions
    const totalExecutionsResult = await Task.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, count: { $sum: '$executionCount' } } },
    ]);
    const totalExecutions = totalExecutionsResult.length > 0 ? totalExecutionsResult[0].count : 0;

    // 5. Recent 5 sessions
    const recentSessions = await TimeSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('taskId', 'name color icon category');

    // 6. Category breakdown (duration per category)
    const categoryBreakdown = await TimeSession.aggregate([
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'task',
        },
      },
      { $unwind: '$task' },
      {
        $group: {
          _id: '$task.category',
          duration: { $sum: '$duration' },
          color: { $first: '$task.color' },
        },
      },
      { $project: { category: '$_id', duration: 1, color: 1, _id: 0 } },
    ]);

    res.status(200).json({
      workedTime: stats,
      activeProjectsCount,
      completedTasksCount,
      totalExecutions,
      recentSessions,
      categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : [{ category: 'General', duration: 0, color: '#7C3AED' }],
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard.' });
  }
};

export const getAnalyticsStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);

    // 1. Daily trend (past 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrend = await TimeSession.aggregate([
      { $match: { userId: userObjectId, startTime: { $gte: fourteenDaysAgo } } },
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
    dailyTrend.forEach((item) => trendMap.set(item._id, item.duration));

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
    // Find all sessions in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await TimeSession.find({ userId, startTime: { $gte: thirtyDaysAgo } });
    const sessionIds = sessions.map((s) => s._id);

    const breaks = await Break.find({ sessionId: { $in: sessionIds } });

    let totalBreaks = 0;
    let totalDeadTime = 0;

    breaks.forEach((b) => {
      if (b.type === 'break') totalBreaks += b.duration;
      if (b.type === 'dead_time') totalDeadTime += b.duration;
    });

    const totalActiveTime = sessions.reduce((sum, s) => sum + s.duration, 0);

    // 3. Task ranking (Top 5 tasks by time)
    const taskRanking = await Task.find({ userId })
      .sort({ totalDuration: -1 })
      .limit(5)
      .select('name totalDuration color category');

    // 4. Project ranking (Top 5 projects by accumulated time)
    const projectRanking = await Project.find({ userId })
      .sort({ accumulatedDuration: -1 })
      .limit(5)
      .select('name accumulatedDuration color client');

    // 5. Math stats: Median & Mode (based on all user's sessions in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysSessions = await TimeSession.find({ userId, startTime: { $gte: ninetyDaysAgo } }).select('duration');
    const durations = ninetyDaysSessions.map((s) => s.duration).sort((a, b) => a - b);

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
      durations.forEach((d) => {
        frequency[d] = (frequency[d] || 0) + 1;
        if (frequency[d] > maxFreq) {
          maxFreq = frequency[d];
          mode = d;
        }
      });
    }

    res.status(200).json({
      dailyTrend: finalTrend,
      productivityRatio: {
        active: totalActiveTime,
        break: totalBreaks,
        deadTime: totalDeadTime,
      },
      taskRanking,
      projectRanking,
      median,
      mode,
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({ error: 'Error al obtener analíticas avanzadas.' });
  }
};
