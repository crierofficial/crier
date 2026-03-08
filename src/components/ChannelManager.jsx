import { useStore } from '../store/useStore';
import { Trash2, Edit2 } from 'lucide-react';
import '../styles/ChannelManager.css';

export default function ChannelManager({ serverId }) {
  const { servers, removeChannel, updateChannel } = useStore();
  const server = servers.find((s) => s.id === serverId);

  const handleNameChange = (serverId, channelId, newName) => {
    updateChannel(serverId, channelId, { name: newName });
  };

  const handleWebhookChange = (serverId, channelId, newWebhook) => {
    updateChannel(serverId, channelId, { webhook: newWebhook });
  };

  if (!server) return <div className="channel-manager">Select a server first</div>;

  return (
    <div className="channel-manager">
      <h3>Channels</h3>
      <div className="channels-list">
        {server.channels.map((channel) => (
          <div key={channel.id} className="channel-item">
            <input
              type="text"
              value={channel.name}
              onChange={(e) =>
                handleNameChange(serverId, channel.id, e.target.value)
              }
              placeholder="Channel name"
              className="channel-name-input"
            />
            <textarea
              value={channel.webhook}
              onChange={(e) =>
                handleWebhookChange(serverId, channel.id, e.target.value)
              }
              placeholder="Webhook URL"
              className="webhook-input"
              rows="2"
            />
            <button
              className="btn btn-danger btn-sm"
              onClick={() => removeChannel(serverId, channel.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
