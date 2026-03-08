import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      servers: [],
      selectedServerId: null,
      logs: [],
      scheduled: [],

      // Server actions
      addServer: (server) =>
        set((state) => ({
          servers: [
            ...state.servers,
            {
              ...server,
              id: Date.now().toString(),
              channels: [],
            },
          ],
        })),

      removeServer: (serverId) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== serverId),
          selectedServerId:
            state.selectedServerId === serverId ? null : state.selectedServerId,
        })),

      updateServer: (serverId, updates) =>
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === serverId ? { ...s, ...updates } : s
          ),
        })),

      setSelectedServer: (serverId) =>
        set(() => ({
          selectedServerId: serverId,
        })),

      // Channel actions
      addChannel: (serverId, channel) =>
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === serverId
              ? {
                  ...s,
                  channels: [
                    ...s.channels,
                    {
                      ...channel,
                      id: Date.now().toString(),
                    },
                  ],
                }
              : s
          ),
        })),

      removeChannel: (serverId, channelId) =>
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === serverId
              ? {
                  ...s,
                  channels: s.channels.filter((c) => c.id !== channelId),
                }
              : s
          ),
        })),

      updateChannel: (serverId, channelId, updates) =>
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === serverId
              ? {
                  ...s,
                  channels: s.channels.map((c) =>
                    c.id === channelId ? { ...c, ...updates } : c
                  ),
                }
              : s
          ),
        })),

      // Log actions
      addLog: (log) =>
        set((state) => ({
          logs: [
            {
              ...log,
              id: Date.now().toString(),
              time: new Date().toLocaleTimeString(),
            },
            ...state.logs,
          ].slice(0, 50),
        })),

      clearLogs: () =>
        set(() => ({
          logs: [],
        })),

      // Scheduled announcement actions
      addScheduled: (scheduled) =>
        set((state) => ({
          scheduled: [
            ...state.scheduled,
            {
              ...scheduled,
              id: Date.now().toString(),
            },
          ],
        })),

      removeScheduled: (scheduledId) =>
        set((state) => ({
          scheduled: state.scheduled.filter((s) => s.id !== scheduledId),
        })),
    }),
    {
      name: 'crier-store',
      storage: localStorage,
    }
  )
);
