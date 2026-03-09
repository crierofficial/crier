import { create } from 'zustand'
import { supabase } from '../supabase'

export const useStore = create((set, get) => ({
  user: null,
  servers: [],
  selectedServerId: null,
  logs: [],
  scheduled: [],

  // Message Templates
  templates: [],
  currentSenderName: '',
  currentMessage: '',

  // Compose form state (for templates)
  templateSenderName: 'SMP Administration',
  templateAvatarUrl: '',
  templateMessage: '',
  templateSelectedChannels: [],

  // Update current compose values (used for template preview)
  setCurrentCompose: (senderName, message) => {
    set({
      currentSenderName: senderName,
      currentMessage: message,
    });
  },

  // Set all compose fields (used by template loading)
  setComposeFields: (fields) => {
    set({
      templateSenderName: fields.senderName || 'SMP Administration',
      templateAvatarUrl: fields.avatarUrl || '',
      templateMessage: fields.message || '',
      templateSelectedChannels: fields.selectedChannels || [],
    });
  },

  fetchTemplates: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ templates: data || [] });
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  },

  saveTemplate: async (name) => {
    const { user, fetchTemplates, templateSenderName, templateAvatarUrl, templateMessage, templateSelectedChannels } = get();
    if (!user || !name || !templateMessage) throw new Error('Missing required fields');
    try {
      const { error } = await supabase
        .from('templates')
        .insert([
          {
            user_id: user.id,
            name,
            sender_name: templateSenderName,
            avatar_url: templateAvatarUrl,
            message: templateMessage,
            selected_channels: templateSelectedChannels,
          },
        ]);
      if (error) throw error;
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    const { fetchTemplates } = get();
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  },

  loadTemplate: (template) => {
    set({
      templateSenderName: template.sender_name || 'SMP Administration',
      templateAvatarUrl: template.avatar_url || '',
      templateMessage: template.message || '',
      templateSelectedChannels: template.selected_channels || [],
      currentSenderName: template.sender_name || '',
      currentMessage: template.message || '',
    });
  },

  // Set user from Auth
  setUser: (user) => {
    set({ user })
    if (user) {
      // Load data when user logs in
      get().loadServers()
      get().loadLogs()
      get().loadScheduled()
    } else {
      // Clear data on logout
      set({
        servers: [],
        selectedServerId: null,
        logs: [],
        scheduled: [],
      })
    }
  },

  // Server actions
  loadServers: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // Load channels for each server
      const serversWithChannels = await Promise.all(
        data.map(async (server) => {
          const { data: channels, error: channelsError } = await supabase
            .from('channels')
            .select('*')
            .eq('server_id', server.id)

          if (channelsError) throw channelsError
          return { ...server, channels: channels || [] }
        })
      )

      set({ servers: serversWithChannels })
    } catch (error) {
      console.error('Error loading servers:', error)
    }
  },

  addServer: async (server) => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('servers')
        .insert([
          {
            user_id: user.id,
            name: server.name,
            icon: server.icon || null,
          },
        ])
        .select()

      if (error) throw error

      set((state) => ({
        servers: [
          ...state.servers,
          { ...data[0], channels: [] },
        ],
        selectedServerId: data[0].id,
      }))
    } catch (error) {
      console.error('Error adding server:', error)
    }
  },

  removeServer: async (serverId) => {
    try {
      // Delete channels first (cascade)
      const { error: channelsError } = await supabase
        .from('channels')
        .delete()
        .eq('server_id', serverId)

      if (channelsError) throw channelsError

      // Then delete server
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId)

      if (error) throw error

      set((state) => ({
        servers: state.servers.filter((s) => s.id !== serverId),
        selectedServerId:
          state.selectedServerId === serverId ? null : state.selectedServerId,
      }))
    } catch (error) {
      console.error('Error removing server:', error)
    }
  },

  updateServer: async (serverId, updates) => {
    try {
      const { error } = await supabase
        .from('servers')
        .update(updates)
        .eq('id', serverId)

      if (error) throw error

      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === serverId ? { ...s, ...updates } : s
        ),
      }))
    } catch (error) {
      console.error('Error updating server:', error)
    }
  },

  setSelectedServer: (serverId) => {
    set({ selectedServerId: serverId })
  },

  // Channel actions
  addChannel: async (serverId, channel) => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('channels')
        .insert([
          {
            server_id: serverId,
            user_id: user.id,
            name: channel.name,
            webhook: channel.webhook,
          },
        ])
        .select()

      if (error) throw error

      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === serverId
            ? {
                ...s,
                channels: [...s.channels, data[0]],
              }
            : s
        ),
      }))
    } catch (error) {
      console.error('Error adding channel:', error)
    }
  },

  removeChannel: async (serverId, channelId) => {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId)

      if (error) throw error

      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === serverId
            ? {
                ...s,
                channels: s.channels.filter((c) => c.id !== channelId),
              }
            : s
        ),
      }))
    } catch (error) {
      console.error('Error removing channel:', error)
    }
  },

  updateChannel: async (serverId, channelId, updates) => {
    try {
      const { error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelId)

      if (error) throw error

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
      }))
    } catch (error) {
      console.error('Error updating channel:', error)
    }
  },

  // Log actions
  loadLogs: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      set({ logs: data || [] })
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  },

  addLog: async (log) => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('logs')
        .insert([
          {
            user_id: user.id,
            channel: log.channel,
            message: log.message || '',
            status: log.status,
          },
        ])
        .select()

      if (error) throw error

      set((state) => ({
        logs: [data[0], ...state.logs].slice(0, 50),
      }))
    } catch (error) {
      console.error('Error adding log:', error)
    }
  },

  clearLogs: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      set({ logs: [] })
    } catch (error) {
      console.error('Error clearing logs:', error)
    }
  },

  // Scheduled actions
  loadScheduled: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('scheduled')
        .select('*')
        .eq('user_id', user.id)
        .order('datetime', { ascending: true })

      if (error) throw error

      // Parse channels JSON from each entry
      const scheduled = (data || []).map((item) => ({
        ...item,
        channels: JSON.parse(item.channels || '[]'),
      }))

      set({ scheduled })

      // Set up auto-send check
      get().setupScheduledCheck()
    } catch (error) {
      console.error('Error loading scheduled:', error)
    }
  },

  addScheduled: async (scheduled) => {
    const { user } = get()
    if (!user) return

    try {
      // Convert local datetime string to UTC ISO string
      // datetime-local gives us YYYY-MM-DDTHH:mm in local time
      // We need to convert this to UTC for storage
      const localDate = new Date(scheduled.datetime)
      const utcDatetime = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString()

      const { data, error } = await supabase
        .from('scheduled')
        .insert([
          {
            user_id: user.id,
            message: scheduled.message,
            sender_name: scheduled.senderName,
            avatar_url: scheduled.avatarUrl,
            channels: JSON.stringify(scheduled.channels),
            datetime: utcDatetime,
            recurrence: scheduled.recurrence || null,
          },
        ])
        .select()

      if (error) throw error

      const newItem = {
        ...data[0],
        channels: JSON.parse(data[0].channels),
      }

      set((state) => ({
        scheduled: [...state.scheduled, newItem],
      }))
    } catch (error) {
      console.error('Error adding scheduled:', error)
    }
  },

  removeScheduled: async (scheduledId) => {
    try {
      const { error } = await supabase
        .from('scheduled')
        .delete()
        .eq('id', scheduledId)

      if (error) throw error

      set((state) => ({
        scheduled: state.scheduled.filter((s) => s.id !== scheduledId),
      }))
    } catch (error) {
      console.error('Error removing scheduled:', error)
    }
  },

  updateScheduled: async (scheduledId, updates) => {
    try {
      const { error } = await supabase
        .from('scheduled')
        .update(updates)
        .eq('id', scheduledId)

      if (error) throw error

      set((state) => ({
        scheduled: state.scheduled.map((s) =>
          s.id === scheduledId ? { ...s, ...updates } : s
        ),
      }))
    } catch (error) {
      console.error('Error updating scheduled:', error)
    }
  },

  setupScheduledCheck: () => {
    const checkScheduled = async () => {
      const { user, scheduled, servers } = get()
      if (!user) return

      const now = new Date()

      for (const sched of scheduled) {
        const schedTime = new Date(sched.datetime)
        if (schedTime <= now && !sched.sent) {
          // Send to all channels
          for (const channelId of sched.channels) {
            let channel = null
            for (const server of servers) {
              const found = server.channels.find((c) => c.id === channelId)
              if (found) {
                channel = found
                break
              }
            }

            if (channel && channel.webhook) {
              try {
                const success = await fetch(channel.webhook, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    username: sched.sender_name,
                    content: sched.message,
                    avatar_url: sched.avatar_url || undefined,
                  }),
                }).then((res) => res.ok || res.status === 204)

                // Log the broadcast
                await get().addLog({
                  channel: channel.name,
                  status: success ? 'success' : 'failed',
                })
              } catch (error) {
                console.error('Error sending webhook:', error)
                await get().addLog({
                  channel: channel.name,
                  status: 'failed',
                })
              }
            }
          }

          // Handle recurrence or mark as sent
          if (sched.recurrence) {
            // Calculate next occurrence
            let nextDateTime = new Date(sched.datetime)
            
            switch (sched.recurrence) {
              case 'every-hour':
                nextDateTime.setHours(nextDateTime.getHours() + 1)
                break
              case 'every-day':
                nextDateTime.setDate(nextDateTime.getDate() + 1)
                break
              case 'every-week':
                nextDateTime.setDate(nextDateTime.getDate() + 7)
                break
              case 'every-monday':
                do {
                  nextDateTime.setDate(nextDateTime.getDate() + 1)
                } while (nextDateTime.getDay() !== 1)
                break
              case 'every-sunday':
                do {
                  nextDateTime.setDate(nextDateTime.getDate() + 1)
                } while (nextDateTime.getDay() !== 0)
                break
              default:
                // If unknown recurrence, treat as one-time
                nextDateTime = null
            }

            // Update with next occurrence instead of marking sent
            if (nextDateTime) {
              try {
                await get().updateScheduled(sched.id, {
                  datetime: nextDateTime.toISOString(),
                  sent: false,
                })
              } catch (error) {
                console.error('Error rescheduling recurring item:', error)
              }
            }
          } else {
            // One-time scheduled - mark as sent
            try {
              await supabase
                .from('scheduled')
                .update({ sent: true })
                .eq('id', sched.id)
            } catch (error) {
              console.error('Error marking scheduled as sent:', error)
            }
          }
        }
      }
    }

    // Check every minute
    const interval = setInterval(checkScheduled, 60000)
    return () => clearInterval(interval)
  },
}))

