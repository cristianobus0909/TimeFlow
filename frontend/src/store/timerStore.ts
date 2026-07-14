import { create } from 'zustand';

export interface BreakSegment {
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  type: 'break' | 'dead_time';
  notes: string;
}

interface TimerState {
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
    projectTaskId?: string | null
  ) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { duration: number; startTime: string; endTime: string; breaks: BreakSegment[] } | null;
  cancelTimer: () => void;
  tick: () => void;
  setNotes: (notes: string) => void;
  syncFromLocalStorage: () => void;
  setCompact: (compact: boolean) => void;
  setAutoStart: (nextTask: { taskId: string; projectId: string; taskName: string; taskColor: string; projectTaskId: string } | null, seconds?: number) => void;
  decrementAutoStart: () => void;
}

export const timerStore = create<TimerState>((set, get) => ({
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

  startTimer: (taskId, projectId, taskName, taskColor, projectTaskId = null) => {
    const startTimeIso = new Date().toISOString();
    const newState = {
      activeTaskId: taskId,
      activeProjectId: projectId,
      activeProjectTaskId: projectTaskId,
      activeTaskName: taskName,
      activeTaskColor: taskColor || '#7C3AED',
      isRunning: true,
      isPaused: false,
      seconds: 0,
      startTime: startTimeIso,
      pausedTime: null,
      breaks: [],
      currentBreakStartTime: null,
      notes: '',
    };
    
    // Save to local storage for recovery
    localStorage.setItem('tf_active_timer', JSON.stringify(newState));
    set(newState);
  },

  pauseTimer: () => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;

    const pausedTimeIso = new Date().toISOString();
    const breakStartIso = pausedTimeIso;

    set({
      isPaused: true,
      pausedTime: pausedTimeIso,
      currentBreakStartTime: breakStartIso,
    });

    // Update localStorage
    const saved = JSON.parse(localStorage.getItem('tf_active_timer') || '{}');
    localStorage.setItem(
      'tf_active_timer',
      JSON.stringify({
        ...saved,
        isPaused: true,
        pausedTime: pausedTimeIso,
        currentBreakStartTime: breakStartIso,
      })
    );
  },

  resumeTimer: () => {
    const state = get();
    if (!state.isRunning || !state.isPaused || !state.currentBreakStartTime) return;

    const now = new Date();
    const breakStart = new Date(state.currentBreakStartTime);
    const breakDuration = Math.max(0, Math.floor((now.getTime() - breakStart.getTime()) / 1000));

    const newBreak: BreakSegment = {
      startTime: state.currentBreakStartTime,
      endTime: now.toISOString(),
      duration: breakDuration,
      type: 'break',
      notes: 'Pausa del temporizador',
    };

    const updatedBreaks = [...state.breaks, newBreak];

    set({
      isPaused: false,
      pausedTime: null,
      currentBreakStartTime: null,
      breaks: updatedBreaks,
    });

    // Update localStorage
    const saved = JSON.parse(localStorage.getItem('tf_active_timer') || '{}');
    localStorage.setItem(
      'tf_active_timer',
      JSON.stringify({
        ...saved,
        isPaused: false,
        pausedTime: null,
        currentBreakStartTime: null,
        breaks: updatedBreaks,
      })
    );
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || state.isPaused || !state.startTime) return;

    const now = new Date().getTime();
    const start = new Date(state.startTime).getTime();

    // Sum up completed breaks duration
    const breaksDuration = state.breaks.reduce((sum, b) => sum + b.duration, 0);

    const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000) - breaksDuration);

    set({ seconds: elapsedSeconds });
  },

  stopTimer: () => {
    const state = get();
    if (!state.isRunning || !state.startTime) return null;

    let finalBreaks = [...state.breaks];
    
    // If stopped while paused, finalize the active break segment
    if (state.isPaused && state.currentBreakStartTime) {
      const now = new Date();
      const breakStart = new Date(state.currentBreakStartTime);
      const breakDuration = Math.max(0, Math.floor((now.getTime() - breakStart.getTime()) / 1000));
      
      finalBreaks.push({
        startTime: state.currentBreakStartTime,
        endTime: now.toISOString(),
        duration: breakDuration,
        type: 'break',
        notes: 'Pausa finalizada al detener',
      });
    }

    const endTimeIso = new Date().toISOString();
    const result = {
      duration: state.seconds,
      startTime: state.startTime,
      endTime: endTimeIso,
      breaks: finalBreaks,
    };

    // Clear state
    localStorage.removeItem('tf_active_timer');
    set({
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

    return result;
  },

  cancelTimer: () => {
    localStorage.removeItem('tf_active_timer');
    set({
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
    const saved = JSON.parse(localStorage.getItem('tf_active_timer') || '{}');
    localStorage.setItem('tf_active_timer', JSON.stringify({ ...saved, notes }));
  },

  syncFromLocalStorage: () => {
    const raw = localStorage.getItem('tf_active_timer');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.isRunning && parsed.startTime) {
        set({
          activeTaskId: parsed.activeTaskId,
          activeProjectId: parsed.activeProjectId,
          activeProjectTaskId: parsed.activeProjectTaskId,
          activeTaskName: parsed.activeTaskName,
          activeTaskColor: parsed.activeTaskColor || '#7C3AED',
          isRunning: parsed.isRunning,
          isPaused: parsed.isPaused,
          startTime: parsed.startTime,
          pausedTime: parsed.pausedTime,
          breaks: parsed.breaks || [],
          currentBreakStartTime: parsed.currentBreakStartTime,
          notes: parsed.notes || '',
        });
        
        // Run initial tick to catch up elapsed time
        get().tick();
      }
    } catch (e) {
      console.error('Failed to sync timer from localStorage:', e);
    }
  },
  setCompact: (compact) => set({ isCompact: compact }),
  setAutoStart: (nextTask, seconds = 5) => set({ nextTaskToAutoStart: nextTask, autoStartCountdown: seconds }),
  decrementAutoStart: () => set((state) => ({ autoStartCountdown: Math.max(0, state.autoStartCountdown - 1) })),
}));
