import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb1" />
        <div className="auth-orb auth-orb2" />
      </div>

      <div className="auth-container fade-in">
        <div className="auth-brand">
          <div className="auth-logo">
            <Stethoscope size={28} />
          </div>
          <h1>AskMyDoc</h1>
          <p>Your 24/7 health companion</p>
        </div>

        <div className="auth-card card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                className="input"
                type="email"
                placeholder="your email address"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="auth-hint">
              If you don't have an account then click on sign up
            </p>
          )}
        </div>

        <div className="auth-features">
          {['AI-powered consultations', 'Mood & health tracking', 'Partner health sharing'].map(f => (
            <div key={f} className="auth-feature">
              <span className="feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .auth-bg { position: fixed; inset: 0; pointer-events: none; }
        
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
        }
        .auth-orb1 {
          width: 500px; height: 500px;
          background: var(--accent);
          top: -150px; right: -100px;
        }
        .auth-orb2 {
          width: 400px; height: 400px;
          background: var(--accent2);
          bottom: -100px; left: -100px;
        }
        
        .auth-container {
          width: 100%;
          max-width: 420px;
          padding: 20px;
          position: relative;
          z-index: 1;
        }
        
        .auth-brand {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .auth-logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 16px;
          box-shadow: 0 8px 30px rgba(79,142,247,0.3);
        }
        
        .auth-brand h1 { font-size: 32px; color: var(--text); }
        .auth-brand p { color: var(--text2); font-size: 14px; margin-top: 4px; }
        
        .auth-card { padding: 28px; }
        
        .auth-tabs {
          display: flex;
          background: var(--bg3);
          border-radius: var(--radius-sm);
          padding: 4px;
          margin-bottom: 24px;
          gap: 4px;
        }
        
        .auth-tab {
          flex: 1;
          padding: 8px;
          border: none;
          background: none;
          border-radius: 8px;
          color: var(--text2);
          cursor: pointer;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .auth-tab.active { background: var(--surface2); color: var(--text); }
        
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 6px; }
        
        .input-with-icon { position: relative; }
        .input-with-icon .input { padding-right: 44px; }
        .input-icon-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          padding: 4px;
        }
        
        .auth-error {
          background: rgba(247,91,79,0.1);
          border: 1px solid rgba(247,91,79,0.3);
          color: var(--danger);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          margin-bottom: 16px;
        }
        
        .auth-hint {
          text-align: center;
          font-size: 12px;
          color: var(--text3);
          margin-top: 16px;
        }
        
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 24px;
          padding: 0 4px;
        }
        
        .auth-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text2);
        }
        
        .feature-dot {
          width: 6px;
          height: 6px;
          background: var(--accent3);
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
