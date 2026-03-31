const mongoose = require('mongoose');

// AFK session — track each AFK start/end
const afkSessionSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end:   { type: Date, default: null },
  ms:    { type: Number, default: 0 }, // duration in ms
}, { _id: false });

const schema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:       { type: String, required: true },
  loginTime:  { type: Date, default: null },
  logoutTime: { type: Date, default: null },
  status:     { type: String, enum: ['present','absent','leave','half-day'], default: 'present' },
  workingMs:  { type: Number, default: 0 },

  // AFK tracking
  afkSessions: { type: [afkSessionSchema], default: [] },
  totalAfkMs:  { type: Number, default: 0 }, // total AFK time
}, { timestamps: true });

schema.index({ user: 1, date: 1 }, { unique: true });

// Virtual: net working time = workingMs - totalAfkMs
schema.virtual('netWorkingMs').get(function() {
  const net = (this.workingMs || 0) - (this.totalAfkMs || 0);
  return net > 0 ? net : (this.workingMs || 0);
});

module.exports = mongoose.model('AttendanceLog', schema);