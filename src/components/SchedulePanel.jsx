import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { sendToWebhook } from '../utils/webhooks';
import { Trash2, Clock } from 'lucide-react';
import '../styles/SchedulePanel.css';

export default function SchedulePanel({ serverId }) {
  const { servers, scheduled, addScheduled, removeScheduled, addLog } =
    useStore();
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('SMP Administration');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [datetime, setDatetime] = useState('');

  const server = servers.find((s) => s.id === serverId);

  // Check every minute if scheduled messages should be sent
  useEffect(() => {
    const checkScheduled = async () => {
      const now = new Date();

      for (const sched of scheduled) {
        if (sched.channels.length === 0) continue;

        const schedTime = new Date(sched.datetime);
        if (schedTime <= now && !sched.sent) {
          // Send to all channels
          const server = servers.find((s) =>
            s.channels.some((c) => sched.channels.includes(c.id))
          );

          if (server) {
            for (const channelId of sched.channels) {
              const channel = server.channels.find((c) => c.id === channelId);
              if (channel && channel.webhook) {
                const success = await sendToWebhook(
                  channel.webhook,
                  sched.message,
                  sched.senderName,
                  sched.avatarUrl
                );
                addLog({
                  channel: channel.name,
                  status: success ? 'success' : 'failed',
                });
              }
            }
          }
        }
      }
    };

    const interval = setInterval(checkScheduled, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [scheduled, servers, addLog]);

  const handleSchedule = () => {
    if (!message.trim() || selectedChannels.length === 0 || !datetime) return;

    addScheduled({
      message: message.trim(),
      senderName,
      avatarUrl,
      channels: selectedChannels,
      datetime,
    });

    setMessage('');
    setSenderName('SMP Administration');
    setAvatarUrl('');
    setSelectedChannels([]);
    setDatetime('');
  };

  const toggleChannel = (channelId) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  if (!server) return null;

  return (
    <div className="schedule-panel">
      <h3>
        <Clock size={18} /> Schedule Announcement
      </h3>

      <div className="form-group">
        <label>Sender Name</label>
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="SMP Administration"
        />
      </div>

      <div className="form-group">
        <label>Avatar URL (optional)</label>
        <input
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="form-group">
        <label>Message (max 2000 chars)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
          placeholder="Your announcement..."
          rows="4"
        />
        <span className="char-count">
          {message.length}/2000
        </span>
      </div>

      <div className="form-group">
        <label>Send Date & Time</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Select Channels</label>
        <div className="channel-chips">
          {server.channels.map((channel) => (
            <button
              key={channel.id}
              className={`chip ${
                selectedChannels.includes(channel.id) ? 'active' : ''
              }`}
              onClick={() => toggleChannel(channel.id)}
            >
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSchedule}>
        Schedule
      </button>

      {scheduled.length > 0 && (
        <div className="scheduled-list">
          <h4>Scheduled Messages</h4>
          {scheduled.map((sched) => (
            <div key={sched.id} className="scheduled-item">
              <div className="scheduled-info">
                <p className="scheduled-time">
                  {new Date(sched.datetime).toLocaleString()}
                </p>
                <p className="scheduled-preview">
                  {sched.message.substring(0, 100)}
                  {sched.message.length > 100 ? '...' : ''}
                </p>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeScheduled(sched.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
