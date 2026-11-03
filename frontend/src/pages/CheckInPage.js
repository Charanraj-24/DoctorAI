import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthAPI } from '../utils/api';
import { Heart, Zap, Moon, Activity, CheckCircle } from 'lucide-react';

const MOOD_LABELS = ['', 'Terrible', 'Very Bad', 'Bad', 'Poor', 'Okay', 'Fine', 'Good', 'Great', 'Excellent', 'Amazing'];
const MOODS = ['😞', '😢', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩'];
const SYMPTOMS = ['Headache', 'Fatigue', 'Nausea', 'Back Pain', 'Anxiety', 'Chest Pain', 'Shortness of Breath', 'Dizziness', 'Fever', 'Cough', 'Insomnia', 'Appetite Loss'];

export default function CheckInPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mood: 5,
    energy: 5,
    sleep: 7,
    pain: 0,
    symptoms: [],
    notes: '',
    vitals: { heartRate: '', bloodPressure: '', temperature: '', weight: '' }
  });

  const toggleSymptom = (s) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s)
        ? prev.symptoms.filter(x => x !== s)
        : [...prev.symptoms, s]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await healthAPI.createCheckin({
        ...form,
        moodLabel: MOOD_LABELS[form.mood],
        vitals: Object.fromEntries(
          Object.entries(form.vitals).filter(([, v]) => v !== '')
        )
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="checkin-success fade-in">
        <div className="success-icon"><CheckCircle size={48} /></div>
        <h2>Check-In Logged!</h2>
        <p>Your health data has been recorded. Keep tracking to spot patterns.</p>
        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ mood: 5, energy: 5, sleep: 7, pain: 0, symptoms: [], notes: '', vitals: {} }); }}>
            Log Another
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page fade-in">
      <div className="page-header">
        <h1>Daily Check-In</h1>
        <p>How are you feeling today?</p>
      </div>

      <div className="checkin-grid">
        {/* Mood */}
        <div className="card">
          <h3><Heart size={16} style={{ color: 'var(--danger)' }} /> Mood</h3>
          <div className="mood-display">
            <span className="mood-emoji">{MOODS[form.mood - 1]}</span>
            <span className="mood-label">{MOOD_LABELS[form.mood]}</span>
          </div>
          <input
            type="range" min="1" max="10" value={form.mood}
            onChange={e => setForm({ ...form, mood: +e.target.value })}
            className="range-slider"
          />
          <div className="range-labels"><span>Terrible</span><span>Amazing</span></div>
        </div>

        {/* Energy */}
        <div className="card">
          <h3><Zap size={16} style={{ color: 'var(--warning)' }} /> Energy</h3>
          <div className="level-display">
            <div className="level-bars">
              {[1,2,3,4,5,6,7,8,9,10].map(v => (
                <div
                  key={v}
                  className={`level-bar ${v <= form.energy ? 'active' : ''}`}
                  style={{ height: `${v * 4 + 8}px`, background: v <= form.energy ? 'var(--warning)' : 'var(--border)' }}
                  onClick={() => setForm({ ...form, energy: v })}
                />
              ))}
            </div>
            <span className="level-value">{form.energy}/10</span>
          </div>
        </div>

        {/* Sleep */}
        <div className="card">
          <h3><Moon size={16} style={{ color: 'var(--accent2)' }} /> Sleep</h3>
          <div className="mood-display">
            <span className="mood-emoji" style={{ fontSize: 32 }}>💤</span>
            <span className="mood-label">{form.sleep}h</span>
          </div>
          <input
            type="range" min="0" max="12" step="0.5" value={form.sleep}
            onChange={e => setForm({ ...form, sleep: +e.target.value })}
            className="range-slider"
          />
          <div className="range-labels"><span>0h</span><span>12h</span></div>
        </div>

        {/* Pain */}
        <div className="card">
          <h3><Activity size={16} style={{ color: 'var(--danger)' }} /> Pain Level</h3>
          <div className="mood-display">
            <span className="mood-emoji" style={{ fontSize: 32 }}>{form.pain === 0 ? '✨' : form.pain <= 3 ? '😊' : form.pain <= 6 ? '😟' : '😣'}</span>
            <span className="mood-label">{form.pain === 0 ? 'No pain' : `${form.pain}/10`}</span>
          </div>
          <input
            type="range" min="0" max="10" value={form.pain}
            onChange={e => setForm({ ...form, pain: +e.target.value })}
            className="range-slider"
            style={{ '--fill': form.pain > 6 ? 'var(--danger)' : form.pain > 3 ? 'var(--warning)' : 'var(--accent)' }}
          />
          <div className="range-labels"><span>None</span><span>Severe</span></div>
        </div>
      </div>

      {/* Symptoms */}
      <div className="card">
        <h3>Symptoms (select all that apply)</h3>
        <div className="symptoms-grid">
          {SYMPTOMS.map(s => (
            <button
              key={s}
              className={`symptom-btn ${form.symptoms.includes(s) ? 'active' : ''}`}
              onClick={() => toggleSymptom(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Vitals (optional) */}
      <div className="card">
        <h3>Vitals <span style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'DM Sans', fontWeight: 400 }}>optional</span></h3>
        <div className="vitals-grid">
          {[
            { key: 'heartRate', label: 'Heart Rate', placeholder: '72 bpm' },
            { key: 'bloodPressure', label: 'Blood Pressure', placeholder: '120/80' },
            { key: 'temperature', label: 'Temperature', placeholder: '98.6°F' },
            { key: 'weight', label: 'Weight', placeholder: '165 lbs' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <input
                className="input"
                placeholder={placeholder}
                value={form.vitals[key] || ''}
                onChange={e => setForm({ ...form, vitals: { ...form.vitals, [key]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h3>Notes</h3>
        <textarea
          className="input"
          placeholder="Anything else to note about how you're feeling today..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Save Check-In'}
      </button>

      <style>{`
        .checkin-page { display: flex; flex-direction: column; gap: 20px; max-width: 800px; }
        .page-header h1 { font-size: 28px; }
        .page-header p { color: var(--text2); margin-top: 4px; }
        
        .checkin-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          margin-bottom: 16px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
        }
        
        .mood-display {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .mood-emoji { font-size: 36px; }
        .mood-label { font-size: 18px; font-weight: 600; color: var(--text); }
        
        .range-slider {
          width: 100%;
          -webkit-appearance: none;
          height: 4px;
          border-radius: 2px;
          background: var(--border2);
          outline: none;
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
        }
        
        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text3);
          margin-top: 4px;
        }
        
        .level-display {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 8px;
        }
        
        .level-bars {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          flex: 1;
        }
        
        .level-bar {
          flex: 1;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .level-bar:hover { opacity: 0.8; }
        
        .level-value { font-size: 20px; font-weight: 600; color: var(--text); }
        
        .symptoms-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .symptom-btn {
          padding: 7px 14px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text2);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .symptom-btn:hover { border-color: var(--accent); color: var(--text); }
        .symptom-btn.active { background: rgba(79,142,247,0.15); border-color: var(--accent); color: var(--accent); }
        
        .vitals-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .form-group label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px; }
        
        .checkin-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
          text-align: center;
        }
        
        .success-icon { color: var(--accent3); margin-bottom: 8px; }
        .checkin-success h2 { font-size: 28px; }
        .checkin-success p { color: var(--text2); max-width: 320px; }
        
        .success-actions { display: flex; gap: 12px; margin-top: 8px; }
        
        @media (max-width: 600px) {
          .checkin-grid { grid-template-columns: 1fr; }
          .vitals-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
