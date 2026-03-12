import type { CreateSessionInput } from './workout';

export interface SyncPayload {
  sessions: CreateSessionInput[];
}

export interface SyncResult {
  pushed: number;
  failed: number;
  errors: Array<{ sessionId: string; error: string }>;
}

export interface OfflineQueueItem {
  id: string;
  payloadType: 'WORKOUT_SESSION' | 'BODY_MEASUREMENT';
  payload: string; // JSON
  createdAt: number; // Unix ms
  retryCount: number;
}

export type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR' | 'SUCCESS';
