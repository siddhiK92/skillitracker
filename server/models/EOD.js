const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },
  projects:  [String],
  completed: [String],
  planned:   [String],
}, { timestamps: true });
schema.index({ user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('EOD', schema);
