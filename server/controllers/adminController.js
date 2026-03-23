const User          = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const EOD           = require('../models/EOD');

const today = () => new Date().toISOString().slice(0, 10);
const fmtMs = ms => {
  if (!ms) return '0h 0m';
  return `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`;
};

exports.overview = async (req, res) => {
  try {
    const t = today();
    const [total, active, online, leave, logs, eodCount] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      User.countDocuments({ isAdmin: false, isActive: true }),
      User.countDocuments({ status: 'online' }),
      User.countDocuments({ status: 'leave' }),
      AttendanceLog.find({ date: t }).populate('user', 'name role color'),
      EOD.countDocuments({ date: t }),
    ]);
    const done = logs.filter(l => l.workingMs > 0);
    const avg  = done.length ? done.reduce((s, l) => s + l.workingMs, 0) / done.length : 0;
    res.json({
      stats: { total, active, online, leave, offline: active - online - leave, present: logs.length, eodCount, avgHours: fmtMs(avg) },
      todayLogs: logs,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password').sort({ name: 1 });
    const logs  = await AttendanceLog.find({ date: today() });
    const map   = {}; logs.forEach(l => { map[l.user.toString()] = l; });
    res.json({ users: users.map(u => ({ ...u.toJSON(), todayLog: map[u._id.toString()] || null })) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const [logs, eods] = await Promise.all([
      AttendanceLog.find({ user: user._id }).sort({ date: -1 }).limit(90),
      EOD.find({ user: user._id }).sort({ date: -1 }).limit(90),
    ]);
    const totalMs = logs.reduce((s, l) => s + (l.workingMs || 0), 0);
    const present = logs.filter(l => l.status === 'present').length;
    res.json({
      user, logs, eods,
      stats: {
        present,
        leave:  logs.filter(l => l.status === 'leave').length,
        hours:  fmtMs(totalMs),
        eods:   eods.length,
        avgMs:  present > 0 ? Math.floor(totalMs / present) : 0,
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role, color, isActive, isAdmin } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (name     != null) user.name     = name;
    if (role     != null) user.role     = role;
    if (color    != null) user.color    = color;
    if (isActive != null) user.isActive = isActive;
    if (isAdmin  != null) user.isAdmin  = isAdmin;
    await user.save();
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete yourself' });
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      AttendanceLog.deleteMany({ user: req.params.id }),
      EOD.deleteMany({ user: req.params.id }),
    ]);
    res.json({ message: 'User deleted successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.overrideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// FIX: Support userId filter for self-history
exports.attendance = async (req, res) => {
  try {
    const { from, to, userId } = req.query;
    const q = {};
    if (from || to) { q.date = {}; if (from) q.date.$gte = from; if (to) q.date.$lte = to; }
    if (userId) q.user = userId;
    const logs = await AttendanceLog.find(q)
      .populate('user', 'name role color')
      .sort({ date: -1 })
      .limit(500);
    res.json({ logs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.allEODs = async (req, res) => {
  try {
    const { date, userId } = req.query;
    const q = {};
    if (date)   q.date = date;
    if (userId) q.user = userId;
    const eods = await EOD.find(q)
      .populate('user', 'name role color')
      .sort({ date: -1 })
      .limit(500);
    res.json({ eods });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Minimum 6 characters required' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};