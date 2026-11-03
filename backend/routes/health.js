import express from 'express';
import CheckIn from '../models/CheckIn.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get check-ins (optionally for a partner)
router.get('/checkins', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    
    // If requesting partner data, verify partnership
    if (req.query.userId && req.query.userId !== req.user._id.toString()) {
      if (!req.user.partnerId || req.user.partnerId.toString() !== req.query.userId) {
        return res.status(403).json({ error: 'Not authorized to view this data' });
      }
    }
    
    const checkins = await CheckIn.find({ userId })
      .sort('-date')
      .limit(parseInt(req.query.limit) || 30);
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create check-in
router.post('/checkins', auth, async (req, res) => {
  try {
    const checkin = await CheckIn.create({ ...req.body, userId: req.user._id });
    res.status(201).json(checkin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update check-in
router.put('/checkins/:id', auth, async (req, res) => {
  try {
    const checkin = await CheckIn.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.json(checkin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete check-in
router.delete('/checkins/:id', auth, async (req, res) => {
  try {
    await CheckIn.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mood stats (past 30 days)
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    
    if (req.query.userId && req.query.userId !== req.user._id.toString()) {
      if (!req.user.partnerId || req.user.partnerId.toString() !== req.query.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checkins = await CheckIn.find({ userId, date: { $gte: thirtyDaysAgo } }).sort('date');
    
    const avgMood = checkins.length ? checkins.reduce((s, c) => s + c.mood, 0) / checkins.length : 0;
    const avgEnergy = checkins.length ? checkins.reduce((s, c) => s + (c.energy || 0), 0) / checkins.length : 0;
    
    res.json({ checkins, avgMood, avgEnergy, total: checkins.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
