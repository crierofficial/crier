import { useStore } from '../store/useStore';
import Sidebar from '../components/Sidebar';
import ComposePanel from '../components/ComposePanel';
import ChannelManager from '../components/ChannelManager';
import SchedulePanel from '../components/SchedulePanel';
import TransmissionLog from '../components/TransmissionLog';
import { Settings } from 'lucide-react';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { selectedServerId } = useStore();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-logo">📢 Crier</h1>
        <button className="btn-settings">
          <Settings size={20} />
        </button>
      </div>

      <div className="dashboard-content">
        <Sidebar />

        <main className="dashboard-main">
          {!selectedServerId ? (
            <div className="empty-state">
              <h2>No server selected</h2>
              <p>Add a server from the sidebar to get started</p>
            </div>
          ) : (
            <>
              <div className="compose-section">
                <ComposePanel serverId={selectedServerId} />
              </div>

              <div className="manager-section">
                <ChannelManager serverId={selectedServerId} />
              </div>

              <div className="schedule-section">
                <SchedulePanel serverId={selectedServerId} />
              </div>

              <div className="log-section">
                <TransmissionLog />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
