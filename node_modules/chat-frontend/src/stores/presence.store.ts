import { create } from 'zustand';
import { PresenceStatus } from '../types';

interface PresenceState {
  presence: Record<string, PresenceStatus>;
  setPresence: (userId: string, status: PresenceStatus) => void;
  setBulkPresence: (map: Record<string, PresenceStatus>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  presence: {},
  setPresence: (userId, status) =>
    set((s) => ({ presence: { ...s.presence, [userId]: status } })),
  setBulkPresence: (map) =>
    set((s) => ({ presence: { ...s.presence, ...map } })),
}));
