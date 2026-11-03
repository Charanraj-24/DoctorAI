import express from 'express';
import Groq from 'groq-sdk';
import ChatSession from '../models/ChatSession.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Lazy init so dotenv loads first
const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are AskMyDoc, an advanced AI medical assistant. You provide:
- Clear, empathetic medical information and guidance
- Possible diagnoses based on symptoms (always noting these are suggestions, not definitive diagnoses)
- General medication information and common dosages
- Lifestyle and wellness recommendations
- When to seek emergency care (always prioritize this when needed)

Important guidelines:
- Always recommend consulting a real doctor for serious conditions or prescriptions
- Never claim to replace professional medical advice
- Be compassionate and clear in your explanations
- Ask clarifying questions when needed
- Format responses clearly with sections when helpful
- Flag red-flag symptoms that require immediate ER attention`;

// Get all chat sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .select('title tags createdAt updatedAt')
      .sort('-updatedAt');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single session
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new session
router.post('/sessions', auth, async (req, res) => {
  try {
    const session = await ChatSession.create({
      userId: req.user._id,
      title: req.body.title || 'New Consultation',
        messages: [{
            role: 'assistant',
            content: "👋 Hello! How are you feeling today? Please describe any symptoms or health concerns you have and I'll do my best to help.",
            timestamp: new Date()
        }]
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message (streaming)
router.post('/sessions/:id/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Build messages for Groq
    const messages = session.messages.map(m => ({ role: m.role, content: m.content }));

    // Call Groq with Llama
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const assistantContent = completion.choices[0].message.content;
    session.messages.push({ role: 'assistant', content: assistantContent });

    // Auto-generate title from first message
    if (session.messages.length === 2) {
      session.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }

    await session.save();
    res.json({ message: assistantContent, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
