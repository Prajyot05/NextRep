import { useSyncStore } from '../store/syncStore';
import { api } from '../api/client';

const MAX_ATTEMPTS = 5;

export async function runSync() {
  const { queue, isSyncing, setSyncing, dequeue, setLastSynced, incrementAttempts } = useSyncStore.getState();

  if (isSyncing || queue.length === 0) return;

  setSyncing(true);

  const eligible = queue.filter((i) => i.attempts < MAX_ATTEMPTS);
  const sessions = eligible.filter((i) => i.type === 'CREATE_SESSION').map((i) => i.payload);

  if (sessions.length > 0) {
    try {
      await api.workouts.sync(sessions);
      eligible.forEach((i) => dequeue(i.id));
      setLastSynced();
    } catch (err) {
      // Increment attempt counters
      eligible.forEach((i) => incrementAttempts(i.id));
    }
  }

  setSyncing(false);
}
