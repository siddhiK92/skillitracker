const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const schema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  username:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  phone:      { type: String, default: '' },
  role:       { type: String, default: 'Team Member' },
  color:      { type: String, default: '#6366F1' },
  isAdmin:    { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },

  // NEW: Admin approval system
  isApproved: { type: Boolean, default: false }, // false = pending approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },

  // NEW: AFK status
  status:     { type: String, enum: ['online','offline','leave','afk'], default: 'offline' },

  loginTime:  { type: Date, default: null },
  logoutTime: { type: Date, default: null },
}, { timestamps: true });

schema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schema.methods.matchPassword = function(p) { return bcrypt.compare(p, this.password); };
schema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };

module.exports = mongoose.model('User', schema);