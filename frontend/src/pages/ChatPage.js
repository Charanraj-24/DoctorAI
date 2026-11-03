import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { chatAPI } from '../utils/api';
import { Send, Plus, Trash2, Stethoscope, AlertCircle } from 'lucide-react';

const QUICK_PROMPTS = [
  'I have a headache and fever',
  'What should I take for a cold?',
  'My back has been hurting',
  'I feel very anxious lately',
  'What vitamins should I take?',
];

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load sessions list
  useEffect(() => {
    chatAPI.getSessions().then(res => setSessions(res.data));
  }, []);

  // Load session
  useEffect(() => {
    if (!sessionId) { setCurrent(null); setMessages([]); return; }
    setLoading(true);
    chatAPI.getSession(sessionId)
      .then(res => { setCurrent(res.data); setMessages(res.data.messages); })
      .catch(() => navigate('/chat'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const newSession = async () => {
    const res = await chatAPI.createSession();
    setSessions(prev => [res.data, ...prev]);
    navigate(`/chat/${res.data._id}`);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    
    if (!sessionId) {
      const res = await chatAPI.createSession();
      setSessions(prev => [res.data, ...prev]);
      navigate(`/chat/${res.data._id}`);
      // The message will be sent after navigation / remount
      localStorage.setItem('pendingMsg', msg);
      return;
    }
    
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setMessages(prev => [...prev, { role: 'assistant', content: null, timestamp: new Date() }]);
    
    try {
      const res = await chatAPI.sendMessage(sessionId, msg);
      setMessages(res.data.session.messages);
      setCurrent(res.data.session);
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, title: res.data.session.title } : s));
    } catch (err) {
      setMessages(prev => prev.slice(0, -1));
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    const pending = localStorage.getItem('pendingMsg');
    if (pending && sessionId) {
      localStorage.removeItem('pendingMsg');
      setTimeout(() => sendMessage(pending), 300);
    }
  }, [sessionId]);

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await chatAPI.deleteSession(id);
    setSessions(prev => prev.filter(s => s._id !== id));
    if (sessionId === id) navigate('/chat');
  };

  return (
    <div className="chat-page">
      {/* Sidebar with sessions */}
      <div className="chat-sidebar">
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }} onClick={newSession}>
          <Plus size={16} /> New Chat
        </button>
        <div className="chat-sessions">
          {sessions.map(s => (
            <div
              key={s._id}
              className={`chat-session-item ${s._id === sessionId ? 'active' : ''}`}
              onClick={() => navigate(`/chat/${s._id}`)}
            >
              <div className="cs-title">{s.title}</div>
              <div className="cs-meta">
                <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                <button className="cs-delete" onClick={(e) => deleteSession(s._id, e)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {!sessionId ? (
          <div className="chat-empty">
            <div className="chat-empty-icon"><Stethoscope size={36} /></div>
            <h2>AI Medical Assistant</h2>
            <p>Describe your symptoms or ask any health question</p>
            <div className="quick-prompts">
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="quick-prompt" onClick={() => sendMessage(p)}>{p}</button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="chat-loading">
            <div className="pulse-dot" />
          </div>
        ) : (
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty small">
                  <p>Start the conversation by describing your symptoms</p>
                  <div className="quick-prompts">
                    {QUICK_PROMPTS.slice(0, 3).map(p => (
                      <button key={p} className="quick-prompt" onClick={() => sendMessage(p)}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role} fade-in`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar"><Stethoscope size={14} /></div>
                  )}
                  <div className="msg-bubble">
                    {msg.content === null ? (
                      <div className="typing">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    ) : (
                      <div className="msg-text" dangerouslySetInnerHTML={{ 
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }} />
                    )}
                    {msg.timestamp && (
                      <div className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>

            <div className="disclaimer">
              <AlertCircle size={12} />
              AI responses are for informational purposes only. Always consult a real doctor for medical decisions.
            </div>

            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="input chat-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Describe your symptoms or ask a health question..."
                rows={2}
                disabled={sending}
              />
              <button className="btn btn-primary send-btn" onClick={() => sendMessage()} disabled={sending || !input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .chat-page {
          display: flex;
          height: calc(100vh - 64px);
          gap: 0;
          margin: -32px;
        }
        
        .chat-sidebar {
          width: 260px;
          min-width: 260px;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          padding: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-sessions {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .chat-session-item {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.2s;
          border: 1px solid transparent;
        }
        .chat-session-item:hover { background: var(--surface); }
        .chat-session-item.active { background: var(--surface); border-color: var(--border); }
        
        .cs-title {
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        
        .cs-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text3);
        }
        
        .cs-delete {
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          padding: 2px;
          opacity: 0;
          transition: all 0.2s;
          border-radius: 4px;
        }
        .chat-session-item:hover .cs-delete { opacity: 1; }
        .cs-delete:hover { color: var(--danger); background: rgba(247,91,79,0.1); }
        
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 40px;
          text-align: center;
        }
        .chat-empty.small { padding: 20px; gap: 12px; }
        
        .chat-empty-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 8px;
        }
        
        .chat-empty h2 { font-size: 24px; }
        .chat-empty p { color: var(--text2); font-size: 14px; max-width: 360px; }
        
        .quick-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 500px;
        }
        
        .quick-prompt {
          padding: 8px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text2);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .quick-prompt:hover { background: var(--surface2); color: var(--text); border-color: var(--accent); }
        
        .chat-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .message.user { flex-direction: row-reverse; }
        
        .msg-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .msg-bubble {
          max-width: 70%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 12px 16px;
        }
        .message.user .msg-bubble {
          background: var(--accent);
          border-color: var(--accent);
          border-top-right-radius: 4px;
        }
        .message.assistant .msg-bubble { border-top-left-radius: 4px; }
        
        .msg-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text);
        }
        .message.user .msg-text { color: white; }
        
        .msg-time {
          font-size: 10px;
          color: var(--text3);
          margin-top: 6px;
          text-align: right;
        }
        .message.user .msg-time { color: rgba(255,255,255,0.6); }
        
        .typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        
        .disclaimer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text3);
          padding: 8px 24px;
          background: rgba(247,161,79,0.05);
          border-top: 1px solid var(--border);
        }
        
        .chat-input-area {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          background: var(--bg2);
          border-top: 1px solid var(--border);
          align-items: flex-end;
        }
        
        .chat-textarea {
          flex: 1;
          resize: none;
          min-height: 48px;
          max-height: 120px;
        }
        
        .send-btn { 
          height: 48px;
          width: 48px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .chat-page { margin: -16px; height: calc(100vh - 56px); }
          .chat-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
