import { create } from 'zustand';

interface OfflineItem {
  id:        string;
  type:      'CREATE_SESSION';
  payload:   any;
  createdAt: string;
  attempts:  number;
}

interface SyncState {
  queue:        OfflineItem[];
  isSyncing:    boolean;
  lastSyncedAt: string | null;

  enqueue:  (item: Omit<OfflineItem, 'attempts'>) => void;
  dequeue:  (id: string) => void;
  setSyncing:(v: boolean) => void;
  setLastSynced: () => void;
  incrementAttempts: (id: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  queue:        [],
  isSyncing:    false,
  lastSyncedAt: null,

  enqueue: (item) => set((state) => ({
    queue: [...state.queue, { ...item, attempts: 0 }],
  })),

  dequeue: (id) => set((state) => ({
    queue: state.queue.filter((i) => i.id !== id),
  })),

  setSyncing: (v) => set({ isSyncing: v }),

  setLastSynced: () => set({ lastSyncedAt: new Date().toISOString() }),

  incrementAttempts: (id) => set((state) => ({
    queue: state.queue.map((i) => i.id === id ? { ...i, attempts: i.attempts + 1 } : i),
  })),
}));
