import { create } from 'zustand';
import { WorkoutSet, WorkoutSession } from '@nextrep/shared';
import uuid from 'react-native-uuid';

interface ActiveSet {
  id:              string;
  exerciseId:      string;
  setNumber:       number;
  type:            'WARMUP' | 'WORKING' | 'DROPSET' | 'FAILURE' | 'AMRAP';
  weightKg?:       number;
  reps?:           number;
  durationSeconds?:number;
  distanceMeters?: number;
  rpe?:            number;
  notes?:          string;
  completedAt?:    string;
  isCompleted:     boolean;
}

interface ExerciseBlock {
  exerciseId:   string;
  exerciseName: string;
  sets:         ActiveSet[];
}

interface ActiveWorkoutState {
  isActive:       boolean;
  sessionId:      string | null;
  name:           string;
  templateId?:    string;
  startedAt?:     Date;
  exercises:      ExerciseBlock[];
  elapsedSeconds: number;
  notes:          string;

  startWorkout: (name: string, templateId?: string) => void;
  addExercise:  (exerciseId: string, exerciseName: string) => void;
  removeExercise:(exerciseId: string) => void;
  addSet:       (exerciseId: string) => void;
  updateSet:    (exerciseId: string, setId: string, update: Partial<ActiveSet>) => void;
  completeSet:  (exerciseId: string, setId: string) => void;
  deleteSet:    (exerciseId: string, setId: string) => void;
  finishWorkout:() => { session: any; sets: any[] } | null;
  discardWorkout:() => void;
  setNotes:     (notes: string) => void;
  tick:         () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  isActive:       false,
  sessionId:      null,
  name:           '',
  templateId:     undefined,
  startedAt:      undefined,
  exercises:      [],
  elapsedSeconds: 0,
  notes:          '',

  startWorkout: (name, templateId) => set({
    isActive:       true,
    sessionId:      uuid.v4() as string,
    name,
    templateId,
    startedAt:      new Date(),
    exercises:      [],
    elapsedSeconds: 0,
    notes:          '',
  }),

  addExercise: (exerciseId, exerciseName) => set((state) => ({
    exercises: [
      ...state.exercises,
      { exerciseId, exerciseName, sets: [] },
    ],
  })),

  removeExercise: (exerciseId) => set((state) => ({
    exercises: state.exercises.filter((e) => e.exerciseId !== exerciseId),
  })),

  addSet: (exerciseId) => set((state) => ({
    exercises: state.exercises.map((block) => {
      if (block.exerciseId !== exerciseId) return block;
      const prevSet = block.sets[block.sets.length - 1];
      return {
        ...block,
        sets: [
          ...block.sets,
          {
            id:          uuid.v4() as string,
            exerciseId,
            setNumber:   block.sets.length + 1,
            type:        'WORKING' as const,
            weightKg:    prevSet?.weightKg,
            reps:        prevSet?.reps,
            isCompleted: false,
          },
        ],
      };
    }),
  })),

  updateSet: (exerciseId, setId, update) => set((state) => ({
    exercises: state.exercises.map((block) =>
      block.exerciseId !== exerciseId ? block : {
        ...block,
        sets: block.sets.map((s) => s.id === setId ? { ...s, ...update } : s),
      },
    ),
  })),

  completeSet: (exerciseId, setId) => set((state) => ({
    exercises: state.exercises.map((block) =>
      block.exerciseId !== exerciseId ? block : {
        ...block,
        sets: block.sets.map((s) =>
          s.id === setId
            ? { ...s, isCompleted: true, completedAt: new Date().toISOString() }
            : s,
        ),
      },
    ),
  })),

  deleteSet: (exerciseId, setId) => set((state) => ({
    exercises: state.exercises.map((block) =>
      block.exerciseId !== exerciseId ? block : {
        ...block,
        sets: block.sets.filter((s) => s.id !== setId),
      },
    ),
  })),

  finishWorkout: () => {
    const state = get();
    if (!state.isActive || !state.startedAt) return null;

    const finishedAt = new Date();
    const allSets = state.exercises.flatMap((block) =>
      block.sets
        .filter((s) => s.isCompleted)
        .map((s) => ({
          exerciseId:      s.exerciseId,
          setNumber:       s.setNumber,
          type:            s.type,
          weightKg:        s.weightKg,
          reps:            s.reps,
          durationSeconds: s.durationSeconds,
          distanceMeters:  s.distanceMeters,
          rpe:             s.rpe,
          notes:           s.notes,
          completedAt:     s.completedAt ?? finishedAt.toISOString(),
        })),
    );

    const session = {
      name:            state.name,
      templateId:      state.templateId,
      startedAt:       state.startedAt.toISOString(),
      finishedAt:      finishedAt.toISOString(),
      durationSeconds: state.elapsedSeconds,
      notes:           state.notes,
      sets:            allSets,
    };

    set({
      isActive:       false,
      sessionId:      null,
      exercises:      [],
      elapsedSeconds: 0,
    });

    return { session, sets: allSets };
  },

  discardWorkout: () => set({
    isActive:       false,
    sessionId:      null,
    exercises:      [],
    elapsedSeconds: 0,
    notes:          '',
  }),

  setNotes: (notes) => set({ notes }),

  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
}));
