import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  shareCode: { type: String, unique: true, default: () => uuidv4().slice(0, 8).toUpperCase() },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  profile: {
    age: Number,
    gender: String,
    bloodType: String,
    allergies: [String],
    conditions: [String],
    medications: [String],
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
