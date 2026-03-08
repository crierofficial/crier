import { useState } from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';
import '../styles/AddServerModal.css';

export default function AddServerModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const { addServer, setSelectedServer } = useStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const serverId = Date.now().toString();
    addServer({
      name: name.trim(),
      icon: icon.trim() || null,
    });
    setSelectedServer(serverId);
    setName('');
    setIcon('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Server</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Server Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My SMP"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Server Icon URL (optional)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add Server
          </button>
        </form>
      </div>
    </div>
  );
}
