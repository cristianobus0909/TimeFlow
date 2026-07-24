import { Task } from '@modules/tasks/task.model';
import { WorkSession, IWorkSession } from '@modules/workSessions/work-session.model';
import { Types } from 'mongoose';

export class StatsService {
  /**
   * Recalculates stats for a task and saves them.
   * @param taskId The ID of the task
   */
  public static async recalculateTaskStats(taskId: string): Promise<void> {
    try {
      // Get all completed sessions for this task, ordered from oldest to newest
      const sessions = await WorkSession.find({
        task: new Types.ObjectId(taskId),
        status: 'COMPLETED',
      }).sort({ createdAt: 1 });

      const count = sessions.length;
      if (count === 0) {
        await Task.findByIdAndUpdate(taskId, {
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          totalDuration: 0,
          executionCount: 0,
        });
        return;
      }

      let totalDuration = 0;
      let minDuration = Infinity;
      let maxDuration = -Infinity;
      const durations: number[] = [];

      sessions.forEach((session: IWorkSession) => {
        const d = session.duration || 0;
        durations.push(d);
        totalDuration += d;
        if (d < minDuration) minDuration = d;
        if (d > maxDuration) maxDuration = d;
      });

      // Calculate Weighted Average: w_i = i^1.5 where i goes from 1 to count
      let sumOfWeights = 0;
      let weightedSum = 0;

      durations.forEach((duration, index) => {
        const i = index + 1; // 1-based index
        const weight = Math.pow(i, 1.5);
        weightedSum += weight * duration;
        sumOfWeights += weight;
      });

      const averageDuration = Math.round(weightedSum / sumOfWeights);

      // Save stats to Task
      await Task.findByIdAndUpdate(taskId, {
        averageDuration,
        minDuration,
        maxDuration,
        totalDuration,
        executionCount: count,
      });

      console.log(`✔ Stats recalculadas para tarea ${taskId}: Promedio Ponderado = ${averageDuration}s, Mín = ${minDuration}s, Máx = ${maxDuration}s, Total = ${totalDuration}s, Cantidad = ${count}`);
    } catch (error) {
      console.error(`❌ Error recalculando estadísticas para tarea ${taskId}:`, error);
    }
  }

  /**
   * Helper function to calculate Standard Deviation and Confidence Level of a task
   * @param durations List of durations in seconds
   * @param average The calculated average duration
   */
  public static calculateConfidence(durations: number[], average: number): 'high' | 'medium' | 'low' {
    const k = durations.length;
    if (k < 5) return 'low'; // low confidence if less than 5 executions

    // Calculate Variance
    const sumOfSquares = durations.reduce((acc, d) => acc + Math.pow(d - average, 2), 0);
    const variance = sumOfSquares / k;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV) = StdDev / Mean
    const cv = average > 0 ? stdDev / average : 0;

    if (k >= 10 && cv < 0.15) {
      return 'high';
    } else if (k >= 5 && cv < 0.30) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
export default StatsService;
