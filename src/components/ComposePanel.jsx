import { useState } from 'react';
import { useStore } from '../store/useStore';
import { sendToWebhook } from '../utils/webhooks';
import { Send } from 'lucide-react';
import '../styles/ComposePanel.css';

export default function ComposePanel({ serverId }) {
  const { servers, addLog, addChannel } = useStore();
  const [senderName, setSenderName] = useState('SMP Administration');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [sending, setSending] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);

  const server = servers.find((s) => s.id === serverId);

  const handleAddChannel = () => {
    if (!newChannelName.trim() || !newWebhookUrl.trim()) return;
    addChannel(serverId, {
      name: newChannelName.trim(),
      webhook: newWebhookUrl.trim(),
    });
    setNewChannelName('');
    setNewWebhookUrl('');
    setShowAddChannel(false);
  };

  const toggleChannel = (channelId) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleBroadcast = async () => {
    if (!message.trim() || selectedChannels.length === 0) return;

    setSending(true);
    for (const channelId of selectedChannels) {
      const channel = server.channels.find((c) => c.id === channelId);
      if (channel && channel.webhook) {
        const success = await sendToWebhook(
          channel.webhook,
          message,
          senderName,
          avatarUrl
        );
        addLog({
          channel: channel.name,
          status: success ? 'success' : 'failed',
        });
      }
    }
    setSending(false);
    setMessage('');
    setSelectedChannels([]);
  };

  if (!server) return null;

  return (
    <div className="compose-panel">
      <h2>Compose Broadcast</h2>

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
          placeholder="Write your announcement here..."
          rows="5"
        />
        <span className="char-count">{message.length}/2000</span>
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

        {!showAddChannel ? (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowAddChannel(true)}
          >
            + Add Channel
          </button>
        ) : (
          <div className="add-channel-form">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              className="input-inline"
            />
            <input
              type="text"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="Webhook URL"
              className="input-inline"
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={handleAddChannel}
            >
              Add
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowAddChannel(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-broadcast"
        onClick={handleBroadcast}
        disabled={sending || selectedChannels.length === 0 || !message.trim()}
      >
        <Send size={18} /> {sending ? 'Broadcasting...' : 'Broadcast'}
      </button>
    </div>
  );
}
