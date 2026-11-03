import express from 'express';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import CheckIn from '../models/CheckIn.js';
import EmergencyAlert from '../models/EmergencyAlert.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Connect with a partner via share code
router.post('/connect', auth, async (req, res) => {
    try {
        const { shareCode } = req.body;
        if (!shareCode) return res.status(400).json({ error: 'Share code required' });

        const partner = await User.findOne({ shareCode: shareCode.toUpperCase() });
        if (!partner) return res.status(404).json({ error: 'Invalid share code' });
        if (partner._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot connect with yourself' });
        }

        // Link both users as partners
        await User.findByIdAndUpdate(req.user._id, { partnerId: partner._id });
        await User.findByIdAndUpdate(partner._id, { partnerId: req.user._id });

        res.json({
            success: true,
            partner: { id: partner._id, name: partner.name, email: partner.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Disconnect partner
router.post('/disconnect', auth, async (req, res) => {
    try {
        if (req.user.partnerId) {
            await User.findByIdAndUpdate(req.user.partnerId, { partnerId: null });
        }
        await User.findByIdAndUpdate(req.user._id, { partnerId: null });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get partner info and shared data
router.get('/data', auth, async (req, res) => {
    try {
        if (!req.user.partnerId) return res.status(404).json({ error: 'No partner connected' });

        const partner = await User.findById(req.user.partnerId).select('-password');
        const partnerCheckins = await CheckIn.find({ userId: req.user.partnerId })
            .sort('-date').limit(10);
        const partnerSessions = await ChatSession.find({ userId: req.user.partnerId })
            .select('title tags createdAt updatedAt').sort('-updatedAt').limit(10);

        res.json({ partner, checkins: partnerCheckins, sessions: partnerSessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── EMERGENCY ALERT ROUTES ───────────────────────────────────────────

// Send emergency alert to partner
router.post('/emergency', auth, async (req, res) => {
    try {
        if (!req.user.partnerId) {
            return res.status(400).json({ error: 'No partner connected' });
        }

        const { message, location } = req.body;

        // Prevent spam - block if alert sent in last 2 minutes
        const recentAlert = await EmergencyAlert.findOne({
            senderId: req.user._id,
            status: 'sent',
            createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
        });

        if (recentAlert) {
            return res.status(429).json({ error: 'Alert already sent. Please wait before sending another.' });
        }

        const alert = await EmergencyAlert.create({
            senderId: req.user._id,
            receiverId: req.user.partnerId,
            message: message || `🚨 EMERGENCY: ${req.user.name} needs immediate help!`,
            location: location || null
        });

        await alert.populate('senderId', 'name email');
        res.status(201).json({ success: true, alert });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Poll for incoming emergency alerts (called every 5s by partner's browser)
router.get('/emergency/incoming', auth, async (req, res) => {
    try {
        const alert = await EmergencyAlert.findOne({
            receiverId: req.user._id,
            status: 'sent'
        })
            .populate('senderId', 'name email')
            .sort('-createdAt');

        res.json({ alert: alert || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Acknowledge alert (partner presses "I'm on my way")
router.put('/emergency/:id/acknowledge', auth, async (req, res) => {
    try {
        const alert = await EmergencyAlert.findOneAndUpdate(
            { _id: req.params.id, receiverId: req.user._id },
            { status: 'acknowledged', acknowledgedAt: new Date() },
            { new: true }
        ).populate('senderId', 'name email');

        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        res.json({ success: true, alert });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resolve alert (sender marks as resolved / false alarm)
router.put('/emergency/:id/resolve', auth, async (req, res) => {
    try {
        const alert = await EmergencyAlert.findOneAndUpdate(
            { _id: req.params.id, senderId: req.user._id },
            { status: 'resolved', resolvedAt: new Date() },
            { new: true }
        );

        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        res.json({ success: true, alert });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check if my sent alert was acknowledged by partner
router.get('/emergency/status', auth, async (req, res) => {
    try {
        const alert = await EmergencyAlert.findOne({
            senderId: req.user._id,
            status: { $in: ['sent', 'acknowledged'] }
        }).sort('-createdAt');

        res.json({ alert: alert || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get alert history
router.get('/emergency/history', auth, async (req, res) => {
    try {
        const alerts = await EmergencyAlert.find({
            $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
        })
            .populate('senderId', 'name')
            .populate('receiverId', 'name')
            .sort('-createdAt')
            .limit(20);

        res.json({ alerts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;