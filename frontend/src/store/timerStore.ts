import { create } from 'zustand';
import { api } from '@shared/services/api';

export interface BreakSegment {
  startTime: string;
  endTime?: string;
  duration: number; // In seconds
  type: 'break' | 'dead_time';
  notes?: string;
}

interface TimerState {
  activeSessionId: string | null;
  activeTaskId: string | null;
  activeProjectId: string | null;
  activeProjectTaskId: string | null;
  activeTaskName: string | null;
  activeTaskColor: string;
  isRunning: boolean;
  isPaused: boolean;
  seconds: number;
  startTime: string | null; // ISOString when first started
  pausedTime: string | null; // ISOString when paused
  breaks: BreakSegment[];
  currentBreakStartTime: string | null; // ISOString when current break started
  notes: string;
  isCompact: boolean;
  nextTaskToAutoStart: { taskId: string; projectId: string; taskName: string; taskColor: string; projectTaskId: string } | null;
  autoStartCountdown: number;
  
  // Actions
  startTimer: (
    taskId: string,
    projectId: string | null,
    taskName: string,
    taskColor: string,
    categoryId?: string | null,
    projectTaskId?: string | null
  ) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<{ duration: number; startTime: string; endTime: string } | null>;
  cancelTimer: () => Promise<void>;
  tick: () => void;
  setNotes: (notes: string) => void;
  syncFromBackend: () => Promise<void>;
  setCompact: (compact: boolean) => void;
  setAutoStart: (nextTask: { taskId: string; projectId: string; taskName: string; taskColor: string; projectTaskId: string } | null, seconds?: number) => void;
  decrementAutoStart: () => void;
}

export const timerStore = create<TimerState>((set, get) => ({
  activeSessionId: null,
  activeTaskId: null,
  activeProjectId: null,
  activeProjectTaskId: null,
  activeTaskName: null,
  activeTaskColor: '#7C3AED',
  isRunning: false,
  isPaused: false,
  seconds: 0,
  startTime: null,
  pausedTime: null,
  breaks: [],
  currentBreakStartTime: null,
  notes: '',
  isCompact: false,
  nextTaskToAutoStart: null,
  autoStartCountdown: 0,

  startTimer: async (taskId, projectId, taskName, taskColor, categoryId = null, projectTaskId = null) => {
    try {
      // Find category: if no categoryId is supplied, default or look up task info
      const resolvedCategory = categoryId || 'general';

      const session: any = await api.post('/work-sessions/start', {
        task: taskId,
        project: projectId || undefined,
        category: resolvedCategory,
        complexity: 'MEDIUM',
        device: 'Web App',
      });

      const newState = {
        activeSessionId: session._id,
        activeTaskId: taskId,
        activeProjectId: projectId,
        activeProjectTaskId: projectTaskId,
        activeTaskName: taskName,
        activeTaskColor: taskColor || '#7C3AED',
        isRunning: true,
        isPaused: false,
        seconds: 0,
        startTime: session.startTime,
        pausedTime: null,
        breaks: [],
        currentBreakStartTime: null,
        notes: '',
      };
      
      set(newState);
    } catch (e) {
      console.error('Failed to start session on backend:', e);
      throw e;
    }
  },

  pauseTimer: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;

    try {
      const session: any = await api.post(`/work-sessions/${activeSessionId}/pause`);
      
      // Locate the latest active break
      const latestBreak = session.breaks[session.breaks.length - 1];
      
      set({
        isPaused: true,
        pausedTime: latestBreak ? latestBreak.startTime : new Date().toISOString(),
        currentBreakStartTime: latestBreak ? latestBreak.startTime : new Date().toISOString(),
        breaks: session.breaks || [],
      });
    } catch (e) {
      console.error('Failed to pause session on backend:', e);
    }
  },

  resumeTimer: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;

    try {
      const session: any = await api.post(`/work-sessions/${activeSessionId}/resume`);
      
      set({
        isPaused: false,
        pausedTime: null,
        currentBreakStartTime: null,
        breaks: session.breaks || [],
      });
      get().tick();
    } catch (e) {
      console.error('Failed to resume session on backend:', e);
    }
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || !state.startTime) return;

    const now = new Date().getTime();
    const start = new Date(state.startTime).getTime();

    // Compute duration of completed break segments
    const completedBreaksDuration = state.breaks
      .filter((b) => b.endTime)
      .reduce((sum, b) => sum + b.duration, 0);

    // If currently paused, compute the ongoing active break duration as well
    let activeBreakDuration = 0;
    if (state.isPaused && state.currentBreakStartTime) {
      const breakStart = new Date(state.currentBreakStartTime).getTime();
      activeBreakDuration = Math.max(0, Math.floor((now - breakStart) / 1000));
    }

    const totalBreaks = completedBreaksDuration + activeBreakDuration;
    const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000) - totalBreaks);

    set({ seconds: elapsedSeconds });
  },

  stopTimer: async () => {
    const state = get();
    if (!state.activeSessionId) return null;

    try {
      const session: any = await api.post(`/work-sessions/${state.activeSessionId}/finish`, {
        notes: state.notes || undefined,
      });

      const result = {
        duration: session.duration || state.seconds,
        startTime: session.startTime,
        endTime: session.endTime || new Date().toISOString(),
      };

      // Clear local state
      set({
        activeSessionId: null,
        activeTaskId: null,
        activeProjectId: null,
        activeProjectTaskId: null,
        activeTaskName: null,
        isRunning: false,
        isPaused: false,
        seconds: 0,
        startTime: null,
        pausedTime: null,
        breaks: [],
        currentBreakStartTime: null,
        notes: '',
      });

      // Dispatch event to trigger dashboard component refetching
      window.dispatchEvent(new CustomEvent('session-logged'));

      return result;
    } catch (e) {
      console.error('Failed to stop session on backend:', e);
      throw e;
    }
  },

  cancelTimer: async () => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      try {
        await api.post(`/work-sessions/${activeSessionId}/cancel`);
      } catch (e) {
        console.error('Failed to cancel session on backend:', e);
      }
    }

    set({
      activeSessionId: null,
      activeTaskId: null,
      activeProjectId: null,
      activeProjectTaskId: null,
      activeTaskName: null,
      isRunning: false,
      isPaused: false,
      seconds: 0,
      startTime: null,
      pausedTime: null,
      breaks: [],
      currentBreakStartTime: null,
      notes: '',
    });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  syncFromBackend: async () => {
    try {
      const active: any = await api.get('/work-sessions/active');
      
      if (active) {
        const activeBreak = (active.breaks || []).find((b: any) => !b.endTime);

        set({
          activeSessionId: active._id,
          activeTaskId: active.task?._id || active.task,
          activeProjectId: active.project?._id || active.project,
          activeTaskName: active.task?.title || 'Sesión de trabajo',
          activeTaskColor: active.project?.color || '#7C3AED',
          isRunning: true,
          isPaused: active.status === 'PAUSED',
          startTime: active.startTime,
          pausedTime: activeBreak ? activeBreak.startTime : null,
          currentBreakStartTime: activeBreak ? activeBreak.startTime : null,
          breaks: active.breaks || [],
          notes: active.notes || '',
        });

        // Trigger immediate tick calculation to catch up timer UI seconds
        get().tick();
      } else {
        // No active timer session, reset state
        set({
          activeSessionId: null,
          activeTaskId: null,
          activeProjectId: null,
          activeProjectTaskId: null,
          activeTaskName: null,
          isRunning: false,
          isPaused: false,
          seconds: 0,
          startTime: null,
          pausedTime: null,
          breaks: [],
          currentBreakStartTime: null,
          notes: '',
        });
      }
    } catch (e) {
      console.error('Failed to sync timer from backend active state:', e);
    }
  },

  setCompact: (isCompact) => set({ isCompact }),
  setAutoStart: (nextTask, seconds = 5) => set({ nextTaskToAutoStart: nextTask, autoStartCountdown: seconds }),
  decrementAutoStart: () => set((state) => ({ autoStartCountdown: Math.max(0, state.autoStartCountdown - 1) })),
}));
