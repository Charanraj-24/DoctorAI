import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, healthAPI } from '../utils/api';
import { MessageSquare, Heart, Trash2, Calendar, Activity } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('chats');
  const [sessions, setSessions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([chatAPI.getSessions(), healthAPI.getCheckins()])
      .then(([s, c]) => { setSessions(s.data); setCheckins(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this consultation?')) return;
    await chatAPI.deleteSession(id);
    setSessions(prev => prev.filter(s => s._id !== id));
  };

  const moodColor = (v) => v >= 8 ? 'var(--accent3)' : v >= 5 ? 'var(--accent)' : 'var(--danger)';
  const moodEmoji = (v) => ['','😞','😢','😟','😕','😐','🙂','😊','😄','😁','🤩'][v] || '😐';

  return (
    <div className="history-page fade-in">
      <div className="page-header">
        <h1>History</h1>
        <p>Your complete health record</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
          <MessageSquare size={14} /> Consultations ({sessions.length})
        </button>
        <button className={`tab ${tab === 'checkins' ? 'active' : ''}`} onClick={() => setTab('checkins')}>
          <Heart size={14} /> Check-Ins ({checkins.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="pulse-dot" style={{ margin: '0 auto' }} /></div>
      ) : tab === 'chats' ? (
        <div className="history-list">
          {sessions.length === 0 ? (
            <div className="empty">
              <MessageSquare size={36} style={{ color: 'var(--text3)' }} />
              <p>No consultations yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/chat')}>Start a consultation</button>
            </div>
          ) : sessions.map(s => (
            <div key={s._id} className="history-item card">
              <div className="history-icon" style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--accent)' }}>
                <MessageSquare size={16} />
              </div>
              <div className="history-content" onClick={() => navigate(`/chat/${s._id}`)}>
                <div className="history-title">{s.title}</div>
                <div className="history-meta">
                  <Calendar size={12} />
                  {new Date(s.createdAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {s.tags?.length > 0 && (
                  <div className="tags">
                    {s.tags.map(t => <span key={t} className="badge badge-blue">{t}</span>)}
                  </div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteSession(s._id)} style={{ color: 'var(--text3)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="history-list">
          {checkins.length === 0 ? (
            <div className="empty">
              <Heart size={36} style={{ color: 'var(--text3)' }} />
              <p>No check-ins yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/checkin')}>Log your first check-in</button>
            </div>
          ) : checkins.map(c => (
            <div key={c._id} className="history-item card">
              <div className="checkin-emoji-large">{moodEmoji(c.mood)}</div>
              <div className="history-content">
                <div className="history-title">
                  Mood: <span style={{ color: moodColor(c.mood) }}>{c.mood}/10</span>
                  {c.energy && <span style={{ marginLeft: 12, color: 'var(--warning)' }}>⚡ {c.energy}/10</span>}
                  {c.sleep && <span style={{ marginLeft: 12, color: 'var(--accent2)' }}>💤 {c.sleep}h</span>}
                </div>
                <div className="history-meta">
                  <Calendar size={12} />
                  {new Date(c.date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {c.symptoms?.length > 0 && (
                  <div className="tags">
                    {c.symptoms.map(s => <span key={s} className="badge badge-red">{s}</span>)}
                  </div>
                )}
                {c.notes && <p className="checkin-notes">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .history-page { display: flex; flex-direction: column; gap: 20px; }
        .page-header h1 { font-size: 28px; }
        .page-header p { color: var(--text2); margin-top: 4px; }
        
        .tabs { display: flex; gap: 8px; }
        .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text2);
          cursor: pointer;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .tab:hover { background: var(--surface); color: var(--text); }
        .tab.active { background: var(--surface); color: var(--text); border-color: var(--accent); }
        
        .history-list { display: flex; flex-direction: column; gap: 8px; }
        
        .history-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .history-item:hover { border-color: var(--border2); }
        
        .history-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .checkin-emoji-large { font-size: 28px; flex-shrink: 0; }
        
        .history-content { flex: 1; min-width: 0; }
        .history-title { font-size: 14px; color: var(--text); font-weight: 500; margin-bottom: 4px; }
        
        .history-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text3);
          margin-bottom: 8px;
        }
        
        .tags { display: flex; flex-wrap: wrap; gap: 4px; }
        
        .checkin-notes {
          font-size: 13px;
          color: var(--text2);
          margin-top: 6px;
          line-height: 1.4;
        }
        
        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px;
          color: var(--text2);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
