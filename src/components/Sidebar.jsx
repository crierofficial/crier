import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2 } from 'lucide-react';
import AddServerModal from './AddServerModal';
import '../styles/Sidebar.css';

export default function Sidebar() {
  const { servers, selectedServerId, setSelectedServer, removeServer } =
    useStore();
  const [showModal, setShowModal] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Servers</h2>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={() => setShowModal(true)}
      >
        <Plus size={18} /> Add Server
      </button>

      <div className="servers-list">
        {servers.map((server) => (
          <div
            key={server.id}
            className={`server-item ${
              selectedServerId === server.id ? 'active' : ''
            }`}
          >
            <button
              className="server-btn"
              onClick={() => setSelectedServer(server.id)}
            >
              {server.icon && (
                <img src={server.icon} alt={server.name} className="server-icon" />
              )}
              <span>{server.name}</span>
            </button>
            <button
              className="btn-delete"
              onClick={() => removeServer(server.id)}
              title="Delete server"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <AddServerModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </aside>
  );
}
