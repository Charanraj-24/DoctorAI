import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  mood: { type: Number, min: 1, max: 10, required: true }, // 1=terrible, 10=great
  moodLabel: String, // 'happy', 'anxious', 'tired', etc.
  energy: { type: Number, min: 1, max: 10 },
  sleep: { type: Number }, // hours slept
  pain: { type: Number, min: 0, max: 10 }, // pain level
  symptoms: [String],
  notes: String,
  vitals: {
    heartRate: Number,
    bloodPressure: String,
    temperature: Number,
    weight: Number
  }
});

export default mongoose.model('CheckIn', checkInSchema);
