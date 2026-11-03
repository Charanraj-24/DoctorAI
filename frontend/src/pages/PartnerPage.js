import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../utils/api';
import { Users, Copy, Check, Link, Unlink, Heart, MessageSquare, AlertTriangle, Phone, MapPin, Clock, CheckCircle, X } from 'lucide-react';

export default function PartnerPage() {
    const { user, updateUser } = useAuth();
    const [partnerData, setPartnerData] = useState(null);
    const [shareCode, setShareCode] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [connecting, setConnecting] = useState(false);

    // Emergency state
    const [sending, setSending] = useState(false);
    const [activeAlert, setActiveAlert] = useState(null);       // alert I sent
    const [incomingAlert, setIncomingAlert] = useState(null);   // alert I received
    const [alertHistory, setAlertHistory] = useState([]);
    const [location, setLocation] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const pollingRef = useRef(null);

    // Get GPS location
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => setLocation(null)
            );
        }
    };

    useEffect(() => { getLocation(); }, []);

    // Poll for incoming alerts every 5 seconds
    const startPolling = useCallback(() => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(async () => {
            try {
                const [incomingRes, statusRes] = await Promise.all([
                    partnerAPI.pollIncoming(),
                    partnerAPI.getStatus()
                ]);
                setIncomingAlert(incomingRes.data.alert);
                setActiveAlert(statusRes.data.alert);
            } catch (e) { }
        }, 5000);
    }, []);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    }, []);

    useEffect(() => {
        if (user?.partnerId) {
            partnerAPI.getPartnerData().then(res => setPartnerData(res.data)).catch(console.error);
            partnerAPI.pollIncoming().then(res => setIncomingAlert(res.data.alert));
            partnerAPI.getStatus().then(res => setActiveAlert(res.data.alert));
            partnerAPI.getHistory().then(res => setAlertHistory(res.data.alerts));
            startPolling();
        }
        return () => stopPolling();
    }, [user?.partnerId, startPolling, stopPolling]);

    // Play alert sound when incoming alert arrives
    useEffect(() => {
        if (incomingAlert) {
            try {
                const ctx = new AudioContext();
                [0, 0.3, 0.6].forEach(delay => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = 880;
                    gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.3);
                });
            } catch (e) { }
        }
    }, [incomingAlert?._id]);

    const copyCode = () => {
        navigator.clipboard.writeText(user?.shareCode || '');
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const connect = async () => {
        if (!shareCode.trim()) return;
        setConnecting(true); setError('');
        try {
            const res = await partnerAPI.connect(shareCode.trim());
            updateUser({ partnerId: res.data.partner.id });
            const data = await partnerAPI.getPartnerData();
            setPartnerData(data.data);
            setShareCode('');
            startPolling();
        } catch (err) {
            setError(err.response?.data?.error || 'Connection failed');
        } finally { setConnecting(false); }
    };

    const disconnect = async () => {
        if (!window.confirm('Disconnect from your partner?')) return;
        stopPolling();
        try {
            await partnerAPI.disconnect();
            updateUser({ partnerId: null });
            setPartnerData(null); setActiveAlert(null); setIncomingAlert(null);
        } catch (err) { console.error(err); }
    };

    const sendEmergency = async () => {
        setShowConfirm(false);
        setSending(true);
        try {
            const res = await partnerAPI.sendEmergency(location);
            setActiveAlert(res.data.alert);
            await partnerAPI.getHistory().then(r => setAlertHistory(r.data.alerts));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send alert');
            setTimeout(() => setError(''), 4000);
        } finally { setSending(false); }
    };

    const acknowledge = async () => {
        try {
            await partnerAPI.acknowledge(incomingAlert._id);
            setIncomingAlert(prev => ({ ...prev, status: 'acknowledged' }));
            await partnerAPI.getHistory().then(r => setAlertHistory(r.data.alerts));
        } catch (err) { console.error(err); }
    };

    const resolve = async () => {
        try {
            await partnerAPI.resolve(activeAlert._id);
            setActiveAlert(null);
            await partnerAPI.getHistory().then(r => setAlertHistory(r.data.alerts));
        } catch (err) { console.error(err); }
    };

    const moodColor = (v) => v >= 8 ? 'var(--accent3)' : v >= 5 ? 'var(--accent)' : 'var(--danger)';
    const moodEmoji = (v) => ['', '😞', '😢', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩'][v] || '😐';
    const timeAgo = (date) => {
        const m = Math.floor((Date.now() - new Date(date)) / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        return `${Math.floor(m / 60)}h ago`;
    };

    return (
        <div className="partner-page fade-in">

            {/* ── INCOMING EMERGENCY BANNER ── */}
            {incomingAlert && incomingAlert.status === 'sent' && (
                <div className="emergency-banner">
                    <div className="banner-pulse" />
                    <div className="banner-content">
                        <AlertTriangle size={28} className="banner-icon" />
                        <div>
                            <div className="banner-title">🚨 EMERGENCY ALERT</div>
                            <div className="banner-msg">{incomingAlert.senderId?.name} needs help!</div>
                            {incomingAlert.location && (
                                <a
                                    className="banner-location"
                                    href={`https://maps.google.com/?q=${incomingAlert.location.latitude},${incomingAlert.location.longitude}`}
                                    target="_blank" rel="noreferrer"
                                >
                                    <MapPin size={12} /> View on Google Maps
                                </a>
                            )}
                            <div className="banner-time"><Clock size={12} /> {timeAgo(incomingAlert.createdAt)}</div>
                        </div>
                        <button className="btn-acknowledge" onClick={acknowledge}>
                            <Phone size={16} /> I'm on my way!
                        </button>
                    </div>
                </div>
            )}

            {incomingAlert && incomingAlert.status === 'acknowledged' && (
                <div className="alert-acknowledged">
                    <CheckCircle size={16} /> You responded to {incomingAlert.senderId?.name}'s emergency
                </div>
            )}

            <div className="page-header">
                <h1>Partner</h1>
                <p>Share your health journey and stay connected in emergencies</p>
            </div>

            {/* Share code */}
            <div className="card share-card">
                <div className="share-label">Your Share Code</div>
                <div className="share-code-display">
                    <span className="share-code">{user?.shareCode}</span>
                    <button className="btn btn-ghost btn-sm" onClick={copyCode}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p className="share-hint">Share this code with your partner so they can connect with you</p>
            </div>

            {!user?.partnerId ? (
                <div className="card">
                    <h3><Link size={16} /> Connect with a Partner</h3>
                    <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
                        Enter your partner's share code to link your health data and enable emergency alerts
                    </p>
                    <div className="connect-form">
                        <input
                            className="input"
                            placeholder="Enter 8-character code (e.g. A1B2C3D4)"
                            value={shareCode}
                            onChange={e => setShareCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: 16 }}
                        />
                        <button className="btn btn-primary" onClick={connect} disabled={connecting || shareCode.length < 8}>
                            {connecting ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                    {error && <div className="error-msg">{error}</div>}
                </div>
            ) : (
                <div className="partner-dashboard">

                    {/* Partner header */}
                    {partnerData && (
                        <div className="partner-header card">
                            <div className="partner-avatar">{partnerData.partner?.name?.[0]?.toUpperCase()}</div>
                            <div>
                                <h2>{partnerData.partner?.name}</h2>
                                <p style={{ color: 'var(--text2)', fontSize: 13 }}>{partnerData.partner?.email}</p>
                            </div>
                            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={disconnect}>
                                <Unlink size={14} /> Disconnect
                            </button>
                        </div>
                    )}

                    {/* ── SOS EMERGENCY BUTTON ── */}
                    <div className="emergency-section card">
                        <div className="sos-header">
                            <div>
                                <h3><AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> Emergency Alert</h3>
                                <p>Press SOS to instantly alert your partner with your location</p>
                            </div>
                            {location && <div className="location-badge"><MapPin size={12} /> Location ready</div>}
                        </div>

                        {activeAlert && activeAlert.status !== 'resolved' ? (
                            <div className="active-alert-status">
                                <div className={`status-indicator ${activeAlert.status}`}>
                                    {activeAlert.status === 'sent' ? (
                                        <><div className="status-dot sending" /> Alert sent — waiting for response...</>
                                    ) : (
                                        <><CheckCircle size={16} style={{ color: 'var(--accent3)' }} /> Partner acknowledged! They're on their way</>
                                    )}
                                </div>
                                <div className="alert-time"><Clock size={12} /> Sent {timeAgo(activeAlert.createdAt)}</div>
                                <button className="btn btn-secondary btn-sm" onClick={resolve}>
                                    <X size={14} /> Mark as Resolved
                                </button>
                            </div>
                        ) : (
                            <>
                                {!showConfirm ? (
                                    <button className="sos-btn" onClick={() => setShowConfirm(true)} disabled={sending}>
                                        <span className="sos-ring" />
                                        <span className="sos-ring sos-ring2" />
                                        <AlertTriangle size={32} />
                                        <span>SOS</span>
                                    </button>
                                ) : (
                                    <div className="sos-confirm">
                                        <p>⚠️ This will immediately alert <strong>{partnerData?.partner?.name}</strong>. Are you sure?</p>
                                        <div className="confirm-actions">
                                            <button className="btn-send-sos" onClick={sendEmergency} disabled={sending}>
                                                {sending ? 'Sending...' : '🚨 YES, Send Emergency Alert'}
                                            </button>
                                            <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                                <p className="sos-hint">Only use in genuine emergencies</p>
                            </>
                        )}
                        {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}
                    </div>

                    {/* Partner health data */}
                    {partnerData && (
                        <div className="partner-stats">
                            <div className="card">
                                <h3><Heart size={16} style={{ color: 'var(--danger)' }} /> Partner's Check-Ins</h3>
                                {!partnerData.checkins?.length ? (
                                    <p style={{ color: 'var(--text3)', fontSize: 13 }}>No check-ins yet</p>
                                ) : (
                                    <div className="checkin-list">
                                        {partnerData.checkins.slice(0, 6).map(c => (
                                            <div key={c._id} className="checkin-row">
                                                <span className="checkin-emoji">{moodEmoji(c.mood)}</span>
                                                <div className="checkin-info">
                                                    <div className="checkin-date">{new Date(c.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                                                    {c.symptoms?.length > 0 && <div className="checkin-symptoms">{c.symptoms.slice(0, 2).join(', ')}</div>}
                                                </div>
                                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                                    <span style={{ fontSize: 12, color: moodColor(c.mood) }}>😊 {c.mood}</span>
                                                    {c.energy && <span style={{ fontSize: 12, color: 'var(--warning)' }}>⚡ {c.energy}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="card">
                                <h3><MessageSquare size={16} style={{ color: 'var(--accent)' }} /> Partner's Consultations</h3>
                                {!partnerData.sessions?.length ? (
                                    <p style={{ color: 'var(--text3)', fontSize: 13 }}>No consultations yet</p>
                                ) : (
                                    <div className="sessions-list">
                                        {partnerData.sessions.slice(0, 6).map(s => (
                                            <div key={s._id} className="session-row">
                                                <div className="session-dot" />
                                                <div>
                                                    <div className="session-title">{s.title}</div>
                                                    <div className="session-date">{new Date(s.updatedAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Alert history */}
                    {alertHistory.length > 0 && (
                        <div className="card">
                            <h3><Clock size={16} /> Alert History</h3>
                            <div className="alert-history">
                                {alertHistory.map(a => (
                                    <div key={a._id} className={`history-row ${a.status}`}>
                                        <AlertTriangle size={14} style={{ color: a.status === 'resolved' ? 'var(--text3)' : 'var(--danger)', flexShrink: 0 }} />
                                        <div className="history-info">
                                            <div className="history-title">
                                                {a.senderId?.name} → {a.receiverId?.name}
                                            </div>
                                            <div className="history-meta">{timeAgo(a.createdAt)}</div>
                                        </div>
                                        <span className={`badge ${a.status === 'resolved' ? 'badge-green' : a.status === 'acknowledged' ? 'badge-blue' : 'badge-red'}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .partner-page { display: flex; flex-direction: column; gap: 20px; max-width: 700px; }
        .page-header h1 { font-size: 28px; }
        .page-header p { color: var(--text2); margin-top: 4px; }

        /* Share card */
        .share-card { background: linear-gradient(135deg, rgba(79,142,247,0.08), rgba(123,92,245,0.08)); border-color: rgba(79,142,247,0.3); }
        .share-label { font-size: 11px; color: var(--text2); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .share-code-display { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .share-code { font-size: 28px; font-family: monospace; letter-spacing: 4px; color: var(--accent); font-weight: 700; }
        .share-hint { font-size: 12px; color: var(--text3); }

        /* Incoming emergency banner */
        .emergency-banner {
          position: relative;
          background: linear-gradient(135deg, #1a0505, #2a0808);
          border: 2px solid var(--danger);
          border-radius: var(--radius);
          padding: 20px 24px;
          overflow: hidden;
          animation: borderPulse 1.5s ease-in-out infinite;
        }
        @keyframes borderPulse {
          0%, 100% { border-color: var(--danger); box-shadow: 0 0 20px rgba(247,91,79,0.3); }
          50% { border-color: #ff8880; box-shadow: 0 0 40px rgba(247,91,79,0.6); }
        }
        .banner-pulse {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(247,91,79,0.08) 0%, transparent 70%);
          animation: pulseBg 1.5s ease-in-out infinite;
        }
        @keyframes pulseBg {
          0%, 100% { opacity: 0.5; } 50% { opacity: 1; }
        }
        .banner-content { position: relative; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .banner-icon { color: var(--danger); animation: shake 0.5s ease infinite; flex-shrink: 0; }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .banner-title { font-size: 18px; font-weight: 700; color: var(--danger); letter-spacing: 1px; }
        .banner-msg { font-size: 15px; color: var(--text); margin-top: 2px; }
        .banner-location {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--accent); text-decoration: none;
          margin-top: 4px;
        }
        .banner-location:hover { text-decoration: underline; }
        .banner-time { font-size: 11px; color: var(--text3); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .btn-acknowledge {
          margin-left: auto;
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px;
          background: var(--danger);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-acknowledge:hover { background: #ff7066; transform: scale(1.05); }

        .alert-acknowledged {
          display: flex; align-items: center; gap: 8px;
          background: rgba(45,212,167,0.1); border: 1px solid rgba(45,212,167,0.3);
          color: var(--accent3); padding: 12px 16px; border-radius: var(--radius-sm);
          font-size: 13px;
        }

        /* SOS section */
        .emergency-section { }
        .sos-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .sos-header h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-family: 'DM Sans'; font-weight: 600; margin-bottom: 4px; }
        .sos-header p { font-size: 13px; color: var(--text2); }
        .location-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--accent3);
          background: rgba(45,212,167,0.1); border: 1px solid rgba(45,212,167,0.2);
          padding: 4px 10px; border-radius: 20px; white-space: nowrap;
        }

        /* SOS button */
        .sos-btn {
          position: relative;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, #c0392b, #8e0000);
          border: none;
          color: white;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 3px;
          cursor: pointer;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 4px;
          margin: 0 auto 16px;
          box-shadow: 0 0 0 8px rgba(247,91,79,0.15), 0 8px 32px rgba(247,91,79,0.4);
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .sos-btn:hover:not(:disabled) {
          transform: scale(1.07);
          box-shadow: 0 0 0 12px rgba(247,91,79,0.2), 0 12px 40px rgba(247,91,79,0.5);
        }
        .sos-btn:active:not(:disabled) { transform: scale(0.96); }
        .sos-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .sos-ring {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 2px solid rgba(247,91,79,0.4);
          animation: sosPulse 2s ease-out infinite;
        }
        .sos-ring2 { animation-delay: 1s; }
        @keyframes sosPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .sos-hint { text-align: center; font-size: 12px; color: var(--text3); }

        /* Confirm dialog */
        .sos-confirm {
          background: rgba(247,91,79,0.08);
          border: 1px solid rgba(247,91,79,0.25);
          border-radius: var(--radius-sm);
          padding: 20px;
          text-align: center;
          margin-bottom: 12px;
        }
        .sos-confirm p { font-size: 14px; color: var(--text); margin-bottom: 16px; line-height: 1.5; }
        .confirm-actions { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .btn-send-sos {
          padding: 14px 28px;
          background: var(--danger);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: all 0.2s;
        }
        .btn-send-sos:hover:not(:disabled) { background: #ff6b5e; }
        .btn-send-sos:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Active alert status */
        .active-alert-status {
          display: flex; flex-direction: column; gap: 10px;
          background: rgba(247,91,79,0.05);
          border: 1px solid rgba(247,91,79,0.2);
          border-radius: var(--radius-sm);
          padding: 16px;
        }
        .status-indicator { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; color: var(--text); }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .status-dot.sending { background: var(--danger); animation: blink 1s ease infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .alert-time { font-size: 12px; color: var(--text3); display: flex; align-items: center; gap: 4px; }

        /* Partner dashboard */
        .partner-dashboard { display: flex; flex-direction: column; gap: 16px; }
        .partner-header { display: flex; align-items: center; gap: 16px; }
        .partner-avatar {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 600; color: white; flex-shrink: 0;
        }
        .partner-header h2 { font-size: 20px; }

        /* Partner stats grid */
        .partner-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; margin-bottom: 16px; font-family: 'DM Sans'; font-weight: 600; }

        .checkin-list, .sessions-list { display: flex; flex-direction: column; gap: 8px; }
        .checkin-row { display: flex; align-items: center; gap: 10px; padding: 8px; background: var(--surface2); border-radius: var(--radius-sm); }
        .checkin-emoji { font-size: 20px; }
        .checkin-info { flex: 1; }
        .checkin-date { font-size: 12px; color: var(--text); font-weight: 500; }
        .checkin-symptoms { font-size: 11px; color: var(--text3); }
        .session-row { display: flex; align-items: center; gap: 10px; padding: 8px; }
        .session-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
        .session-title { font-size: 13px; color: var(--text); }
        .session-date { font-size: 11px; color: var(--text3); margin-top: 2px; }

        /* Alert history */
        .alert-history { display: flex; flex-direction: column; gap: 8px; }
        .history-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--surface2); border-radius: var(--radius-sm); }
        .history-info { flex: 1; }
        .history-title { font-size: 13px; color: var(--text); }
        .history-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }

        /* Connect form */
        .connect-form { display: flex; gap: 12px; }
        .connect-form .input { flex: 1; }
        .error-msg { margin-top: 12px; padding: 10px 14px; background: rgba(247,91,79,0.1); border: 1px solid rgba(247,91,79,0.3); border-radius: var(--radius-sm); color: var(--danger); font-size: 13px; }

        @media (max-width: 600px) {
          .partner-stats { grid-template-columns: 1fr; }
          .connect-form { flex-direction: column; }
          .banner-content { flex-direction: column; }
          .btn-acknowledge { width: 100%; justify-content: center; }
          .sos-header { flex-direction: column; gap: 8px; }
        }
      `}</style>
        </div>
    );
}