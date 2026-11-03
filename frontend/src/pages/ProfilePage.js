import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { User, Shield, Save } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user?.profile || {});
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ profile });
      updateUser({ profile: res.data.profile });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addToList = (key, value, setter) => {
    if (!value.trim()) return;
    setProfile(prev => ({ ...prev, [key]: [...(prev[key] || []), value.trim()] }));
    setter('');
  };

  const removeFromList = (key, index) => {
    setProfile(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  return (
    <div className="profile-page fade-in">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your medical profile helps AI provide better answers</p>
      </div>

      <div className="profile-header card">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <h2>{user?.name}</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>{user?.email}</p>
        </div>
        <div className="share-badge">
          <Shield size={12} /> #{user?.shareCode}
        </div>
      </div>

      <div className="profile-grid">
        <div className="card">
          <h3><User size={15} /> Basic Info</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input className="input" type="number" placeholder="28" value={profile.age || ''} onChange={e => setProfile({ ...profile, age: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="input" value={profile.gender || ''} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label>Blood Type</label>
              <select className="input" value={profile.bloodType || ''} onChange={e => setProfile({ ...profile, bloodType: e.target.value })}>
                <option value="">Select</option>
                {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {[
          { key: 'allergies', label: 'Allergies', icon: '⚠️', placeholder: 'e.g. Penicillin', color: 'badge-red', input: allergyInput, setter: setAllergyInput },
          { key: 'conditions', label: 'Medical Conditions', icon: '🏥', placeholder: 'e.g. Hypertension', color: 'badge-blue', input: conditionInput, setter: setConditionInput },
          { key: 'medications', label: 'Current Medications', icon: '💊', placeholder: 'e.g. Metformin 500mg', color: 'badge-green', input: medicationInput, setter: setMedicationInput },
        ].map(({ key, label, icon, placeholder, color, input, setter }) => (
          <div key={key} className="card">
            <h3>{icon} {label}</h3>
            <div className="tag-input-row">
              <input
                className="input"
                placeholder={placeholder}
                value={input}
                onChange={e => setter(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addToList(key, input, setter); }}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => addToList(key, input, setter)}>Add</button>
            </div>
            <div className="tags">
              {(profile[key] || []).map((item, i) => (
                <span key={i} className={`badge ${color}`} style={{ cursor: 'pointer' }} onClick={() => removeFromList(key, i)}>
                  {item} ×
                </span>
              ))}
              {(!profile[key] || profile[key].length === 0) && (
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>None added</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
        <Save size={16} />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>

      <style>{`
        .profile-page { display: flex; flex-direction: column; gap: 20px; max-width: 700px; }
        .page-header h1 { font-size: 28px; }
        .page-header p { color: var(--text2); margin-top: 4px; }
        
        .profile-header { display: flex; align-items: center; gap: 16px; }
        
        .profile-avatar {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }
        
        .profile-header h2 { font-size: 20px; }
        
        .share-badge {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(79,142,247,0.1);
          color: var(--accent);
          border-radius: 20px;
          font-size: 13px;
          font-family: monospace;
          border: 1px solid rgba(79,142,247,0.2);
        }
        
        .profile-grid { display: flex; flex-direction: column; gap: 16px; }
        
        .card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          margin-bottom: 16px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .form-group label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px; }
        
        .tag-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .tag-input-row .input { flex: 1; }
        
        .tags { display: flex; flex-wrap: wrap; gap: 6px; }
        
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
