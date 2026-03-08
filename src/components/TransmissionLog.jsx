import { useStore } from '../store/useStore';
import { Trash2 } from 'lucide-react';
import '../styles/TransmissionLog.css';

export default function TransmissionLog() {
  const { logs, clearLogs } = useStore();

  return (
    <div className="transmission-log">
      <div className="log-header">
        <h3>Transmission Log</h3>
        {logs.length > 0 && (
          <button className="btn btn-sm btn-muted" onClick={clearLogs}>
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>
      <div className="logs-container">
        {logs.length === 0 ? (
          <p className="log-empty">No transmissions yet</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-entry log-${log.status}`}>
              <span className="log-time">{log.time}</span>
              <span className="log-channel">{log.channel}</span>
              <span className={`log-status ${log.status}`}>
                {log.status === 'success' ? '✓' : '✗'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
