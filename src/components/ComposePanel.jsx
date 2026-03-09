
import { useState, forwardRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Send } from 'lucide-react';
import '../styles/ComposePanel.css';

// Discord Markdown Parser
function parseDiscordMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre class="discord-codeblock"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="discord-inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\|\|(.+?)\|\|/g, '<span class="discord-spoiler">$1</span>')
    .replace(/^&gt; (.+)/gm, '<div class="discord-quote">$1</div>')
    .replace(/@everyone|@here/g, '<span class="discord-mention">$&</span>')
    .replace(/@(\w+)/g, '<span class="discord-mention">@$1</span>')
    .replace(/#(\w+)/g, '<span class="discord-channel">#$1</span>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a class="discord-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br/>');
  return html;
}

function DiscordPreview({ senderName, avatarUrl, message, embed }) {
  if (!senderName && !message && !embed) return null;
  const now = new Date();
  const time = `Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const dateString = 'March 9, 2026';
  return (
    <div>
      <div className="discord-preview-label-strict">DISCORD PREVIEW</div>
      <div className="discord-date-separator">
        <span className="discord-date-line" />
        <span className="discord-date-text">{dateString}</span>
        <span className="discord-date-line" />
      </div>
      <div className="discord-message-preview">
        <div className="discord-avatar" style={{ background: avatarUrl ? 'none' : 'linear-gradient(135deg,#c8a55a,#00d4ff)' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            : (senderName?.[0]?.toUpperCase() || '?')}
        </div>
        <div className="discord-message-content">
          <span className="discord-username">{senderName || <span className="preview-empty">No sender</span>}</span>
          <span className="discord-timestamp">{time}</span>
          <div
            className="discord-message-text"
            dangerouslySetInnerHTML={{ __html: message ? parseDiscordMarkdown(message) : '<span class="preview-empty" style="color:#4a5568;font-style:italic">No message</span>' }}
          />
          {embed && (embed.title || embed.description || embed.image || embed.footer) && (
            <div className="discord-embed-preview" style={{ borderLeft: `4px solid ${embed.color || '#c8a55a'}` }}>
              {embed.title && <div className="discord-embed-title">{embed.title}</div>}
              {embed.description && <div className="discord-embed-description">{embed.description}</div>}
              {embed.image && (
                <img src={embed.image} alt="embed" className="discord-embed-image" />
              )}
              {embed.footer && <div className="discord-embed-footer">{embed.footer}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default forwardRef(function ComposePanel({
  serverId,
  senderInputRef,
  messageInputRef,
  broadcastBtnRef,
  setActiveTab,
}, ref) {
  const {
    servers,
    addLog,
    addChannel,
    setCurrentCompose,
    setComposeFields,
    templateSenderName,
    templateAvatarUrl,
    templateMessage,
    templateSelectedChannels,
  } = useStore();

  // Local state for runtime changes
  const [senderName, setSenderName] = useState(templateSenderName);
  const [avatarUrl, setAvatarUrl] = useState(templateAvatarUrl);
  const [message, setMessage] = useState(templateMessage);
  const [selectedChannels, setSelectedChannels] = useState(templateSelectedChannels);
  const [sending, setSending] = useState(false);
  // Embed state
  const [embedActive, setEmbedActive] = useState(false);
  const [embedColor, setEmbedColor] = useState('#c8a55a');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [embedImageUrl, setEmbedImageUrl] = useState('');
  const [embedFooter, setEmbedFooter] = useState('Crier — Free Discord Broadcast Tool');
  // Broadcast to all state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState('');
  const [broadcastResult, setBroadcastResult] = useState('');

  const server = servers.find((s) => s.id === serverId);

  // Update handlers that sync to store
  const handleSenderNameChange = (e) => {
    const value = e.target.value;
    setSenderName(value);
    setComposeFields({ senderName: value, avatarUrl, message, selectedChannels });
  };

  const handleAvatarUrlChange = (e) => {
    const value = e.target.value;
    setAvatarUrl(value);
    setComposeFields({ senderName, avatarUrl: value, message, selectedChannels });
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    setComposeFields({ senderName, avatarUrl, message: value, selectedChannels });
    setCurrentCompose(senderName, value);
  };

  const handleSelectedChannelsChange = (channels) => {
    setSelectedChannels(channels);
    setComposeFields({ senderName, avatarUrl, message, selectedChannels: channels });
  };

  // Sync store changes to local state
  useEffect(() => {
    setSenderName(templateSenderName);
  }, [templateSenderName]);

  useEffect(() => {
    setAvatarUrl(templateAvatarUrl);
  }, [templateAvatarUrl]);

  useEffect(() => {
    setMessage(templateMessage);
    setCurrentCompose(templateSenderName, templateMessage);
  }, [templateMessage, templateSenderName, setCurrentCompose]);

  useEffect(() => {
    setSelectedChannels(templateSelectedChannels);
  }, [templateSelectedChannels]);

  const toggleChannel = (channelId) => {
    setSelectedChannels((prev) => {
      const newChannels = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      setComposeFields({ senderName, avatarUrl, message, selectedChannels: newChannels });
      return newChannels;
    });
  };

  const handleBroadcast = async () => {
    if (!message.trim() || selectedChannels.length === 0) return;

    setSending(true);
    for (const channelId of selectedChannels) {
      const channel = server.channels.find((c) => c.id === channelId);
      if (channel && channel.webhook) {
        try {
          const body = {
            username: senderName,
            content: message,
            avatar_url: avatarUrl || undefined,
          };
          if (embedActive) {
            body.embeds = [
              {
                color: parseInt(embedColor.replace('#', ''), 16),
                title: embedTitle,
                description: embedDescription,
                image: embedImageUrl ? { url: embedImageUrl } : undefined,
                footer: embedFooter ? { text: embedFooter } : undefined,
              },
            ];
          }
          const success = await fetch(channel.webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).then((res) => res.ok || res.status === 204);

          await addLog({
            channel: channel.name,
            message: message,
            status: success ? 'success' : 'failed',
          });
        } catch (error) {
          console.error('Error sending webhook:', error);
          await addLog({
            channel: channel.name,
            message: message,
            status: 'failed',
          });
        }
      }
    }
    setSending(false);
    setMessage('');
    setSelectedChannels([]);
    if (embedActive) {
      setEmbedTitle('');
      setEmbedDescription('');
      setEmbedImageUrl('');
      setEmbedFooter('Crier — Free Discord Broadcast Tool');
    }
  };

  const handleBroadcastAll = async () => {
    if (!message.trim() || servers.length === 0) return;

    setIsBroadcasting(true);
    let sentCount = 0;
    let failCount = 0;
    let totalChannels = 0;

    for (const srv of servers) {
      for (const channel of srv.channels) {
        totalChannels++;
        setBroadcastProgress(`${sentCount + failCount}/${totalChannels}`);

        if (channel.webhook) {
          try {
            const body = {
              username: senderName,
              content: message,
              avatar_url: avatarUrl || undefined,
            };
            if (embedActive) {
              body.embeds = [
                {
                  color: parseInt(embedColor.replace('#', ''), 16),
                  title: embedTitle,
                  description: embedDescription,
                  image: embedImageUrl ? { url: embedImageUrl } : undefined,
                  footer: embedFooter ? { text: embedFooter } : undefined,
                },
              ];
            }
            const success = await fetch(channel.webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            }).then((res) => res.ok || res.status === 204);

            if (success) {
              sentCount++;
            } else {
              failCount++;
            }

            await addLog({
              channel: channel.name,
              message: message,
              status: success ? 'success' : 'failed',
            });
          } catch (error) {
            console.error('Error sending webhook:', error);
            failCount++;
            await addLog({
              channel: channel.name,
              message: message,
              status: 'failed',
            });
          }
        }
      }
    }

    setIsBroadcasting(false);
    setBroadcastProgress('');
    setBroadcastResult(`✓ COMPLETE — ${sentCount} sent, ${failCount} failed`);
    setTimeout(() => {
      setBroadcastResult('');
    }, 3000);
    setMessage('');
    setSelectedChannels([]);
    if (embedActive) {
      setEmbedTitle('');
      setEmbedDescription('');
      setEmbedImageUrl('');
      setEmbedFooter('Crier — Free Discord Broadcast Tool');
    }
  };

  if (!server) return null;

  return (
    <div className="compose-panel" ref={ref}>
      {/* Panel header with embed toggle */}
      <div className="compose-header-row">
        <h2>Compose Broadcast</h2>
        <button
          className={`embed-toggle-btn${embedActive ? ' active' : ''}`}
          type="button"
          onClick={() => setEmbedActive((v) => !v)}
        >
          {embedActive ? 'EMBED ON' : 'EMBED OFF'}
        </button>
      </div>

      {/* Two-column grid layout */}
      <div className="compose-grid">
        {/* LEFT COLUMN: inputs */}
        <div className="compose-left">
          <div className="form-group">
            <label>Sender Name</label>
            <input
              ref={senderInputRef}
              type="text"
              value={senderName}
              onChange={handleSenderNameChange}
              placeholder="Crier"
            />
          </div>

          <div className="form-group">
            <label>Avatar URL (optional)</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={handleAvatarUrlChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={handleMessageChange}
              placeholder="This message was sent via Crier — your free Discord broadcast tool."
              className="message-textarea"
            />
          </div>

          {/* Embed fields (only when embed active) */}
          {embedActive && (
            <div className="embed-fields">
              <div className="form-group">
                <label>Embed Color</label>
                <input
                  type="color"
                  value={embedColor}
                  onChange={e => setEmbedColor(e.target.value)}
                  style={{ width: 40, height: 28, border: 'none', background: 'none', marginLeft: 8 }}
                />
              </div>
              <div className="form-group">
                <label>Embed Title</label>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={e => setEmbedTitle(e.target.value)}
                  placeholder="Announcement Title"
                />
              </div>
              <div className="form-group">
                <label>Embed Description</label>
                <textarea
                  value={embedDescription}
                  onChange={e => setEmbedDescription(e.target.value)}
                  placeholder="Detailed description..."
                />
              </div>
              <div className="form-group">
                <label>Embed Image URL</label>
                <input
                  type="text"
                  value={embedImageUrl}
                  onChange={e => setEmbedImageUrl(e.target.value)}
                  placeholder="https://image-url..."
                />
              </div>
              <div className="form-group">
                <label>Embed Footer</label>
                <input
                  type="text"
                  value={embedFooter}
                  onChange={e => setEmbedFooter(e.target.value)}
                  placeholder="Crier — Free Discord Broadcast Tool"
                />
              </div>
            </div>
          )}

          {/* Channel chips */}
          <div className="channels-list" style={{ margin: '18px 0 12px' }}>
            {server.channels.length === 0 ? (
              <p className="no-channels-hint">No channels yet — add them in the ⚙️ Settings tab</p>
            ) : (
              server.channels.map((channel) => (
                <button
                  key={channel.id}
                  className={`chip ${selectedChannels.includes(channel.id) ? 'active' : ''}`}
                  onClick={() => toggleChannel(channel.id)}
                >
                  {channel.name}
                </button>
              ))
            )}
          </div>

          {/* Broadcast button row */}
          <div className="broadcast-btn-row">
            <button
              ref={broadcastBtnRef}
              className="btn-broadcast-now"
              onClick={handleBroadcast}
              disabled={sending || selectedChannels.length === 0 || !message.trim()}
            >
              <Send size={16} /> {sending ? 'SENDING...' : '◈ BROADCAST NOW'}
            </button>
            <button
              className="btn-schedule-quick"
              onClick={() => setActiveTab?.('schedule')}
              disabled={!message.trim()}
            >
              ⏰ SCHEDULE
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: sticky Discord preview */}
        <div className="compose-right">
          <DiscordPreview
            senderName={senderName}
            avatarUrl={avatarUrl}
            message={message}
            embed={embedActive ? {
              color: embedColor,
              title: embedTitle,
              description: embedDescription,
              image: embedImageUrl,
              footer: embedFooter,
            } : null}
          />
        </div>
      </div>
    </div>
  );
});
