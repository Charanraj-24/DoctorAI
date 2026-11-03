import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthAPI, chatAPI } from '../utils/api';
import { MessageSquare, Heart, TrendingUp, Plus, ChevronRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      healthAPI.getStats(),
      chatAPI.getSessions()
    ]).then(([statsRes, sessionsRes]) => {
      setStats(statsRes.data);
      setSessions(sessionsRes.data.slice(0, 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const moodColor = (v) => {
    if (v >= 8) return 'var(--accent3)';
    if (v >= 5) return 'var(--accent)';
    return 'var(--danger)';
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const chartData = stats?.checkins?.slice(-14).map(c => ({
    date: new Date(c.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    mood: c.mood,
    energy: c.energy
  })) || [];

  const startChat = async () => {
    try {
      const res = await chatAPI.createSession('New Consultation');
      navigate(`/chat/${res.data._id}`);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="dashboard fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dash-subtitle">How are you feeling today?</p>
        </div>
        <button className="btn btn-primary" onClick={startChat}>
          <Plus size={16} /> New Consultation
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent)' }}>
            <MessageSquare size={20} />
          </div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-label">Consultations</div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(247,161,79,0.15)', color: 'var(--warning)' }}>
            <Heart size={20} />
          </div>
          <div className="stat-value" style={{ color: stats?.avgMood ? moodColor(stats.avgMood) : 'var(--text)' }}>
            {stats?.avgMood ? stats.avgMood.toFixed(1) : '—'}
          </div>
          <div className="stat-label">Avg Mood</div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(45,212,167,0.15)', color: 'var(--accent3)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Check-Ins</div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(123,92,245,0.15)', color: 'var(--accent2)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-value">{stats?.avgEnergy ? stats.avgEnergy.toFixed(1) : '—'}</div>
          <div className="stat-label">Avg Energy</div>
        </div>
      </div>

      <div className="dash-grid">
        {chartData.length > 1 && (
          <div className="card">
            <h3 className="section-title">Mood Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                <Line type="monotone" dataKey="mood" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="energy" stroke="var(--accent3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span style={{ color: 'var(--accent)' }}>● Mood</span>
              <span style={{ color: 'var(--accent3)' }}>● Energy</span>
            </div>
          </div>
        )}

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Recent Consultations</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={32} style={{ color: 'var(--text3)' }} />
              <p>No consultations yet</p>
              <button className="btn btn-primary btn-sm" onClick={startChat}>Start one</button>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map(s => (
                <div key={s._id} className="session-item" onClick={() => navigate(`/chat/${s._id}`)}>
                  <div className="session-icon"><MessageSquare size={14} /></div>
                  <div className="session-info">
                    <div className="session-title">{s.title}</div>
                    <div className="session-date">{new Date(s.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
        <div className="actions-grid">
          {[
            { label: 'Log Check-In', icon: Heart, color: 'var(--danger)', path: '/checkin' },
            { label: 'Ask AI Doctor', icon: MessageSquare, color: 'var(--accent)', action: startChat },
            { label: 'View History', icon: Activity, color: 'var(--accent3)', path: '/history' },
          ].map(({ label, icon: Icon, color, path, action }) => (
            <button key={label} className="quick-btn" onClick={() => action ? action() : navigate(path)}>
              <Icon size={20} style={{ color }} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .dashboard { display: flex; flex-direction: column; gap: 24px; }
        
        .dash-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .dash-greeting { font-size: 28px; color: var(--text); }
        .dash-subtitle { color: var(--text2); margin-top: 4px; font-size: 14px; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 20px;
        }
        
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-value { font-size: 28px; font-family: 'DM Serif Display', serif; color: var(--text); }
        .stat-label { font-size: 12px; color: var(--text3); }
        
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .section-title { font-size: 16px; color: var(--text); margin-bottom: 16px; }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .section-header .section-title { margin-bottom: 0; }
        
        .chart-legend {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          font-size: 12px;
          color: var(--text2);
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          color: var(--text2);
          font-size: 14px;
        }
        
        .sessions-list { display: flex; flex-direction: column; gap: 4px; }
        
        .session-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.2s;
        }
        .session-item:hover { background: var(--surface2); }
        
        .session-icon {
          width: 30px;
          height: 30px;
          background: rgba(79,142,247,0.1);
          color: var(--accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .session-info { flex: 1; min-width: 0; }
        .session-title { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .session-date { font-size: 11px; color: var(--text3); margin-top: 2px; }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .quick-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text2);
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .quick-btn:hover { background: var(--bg3); color: var(--text); transform: translateY(-2px); }
        
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .dash-header { flex-direction: column; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .actions-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
