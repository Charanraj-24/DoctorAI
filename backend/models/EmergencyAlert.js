import mongoose from 'mongoose';

const emergencyAlertSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: 'EMERGENCY: Your partner needs immediate help!' },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: { type: String, enum: ['sent', 'acknowledged', 'resolved'], default: 'sent' },
  acknowledgedAt: Date,
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('EmergencyAlert', emergencyAlertSchema);
