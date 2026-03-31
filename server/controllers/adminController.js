const User          = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const EOD           = require('../models/EOD');

const today = () => new Date().toISOString().slice(0, 10);

const fmtMs = ms => {
  if (!ms || ms <= 0) return '0h 0m';
  return `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`;
};

exports.overview = async (req, res) => {
  try {
    const t = today();
    const [total, online, leave, afk, logs, eodCount, pendingApproval] = await Promise.all([
      User.countDocuments({ isAdmin:false, isApproved:true }),
      User.countDocuments({ status:'online' }),
      User.countDocuments({ status:'leave' }),
      User.countDocuments({ status:'afk' }),
      AttendanceLog.find({ date:t }).populate('user','name role color status'),
      EOD.countDocuments({ date:t }),
      User.countDocuments({ isAdmin:false, isApproved:false }),
    ]);
    const active = await User.countDocuments({ isAdmin:false, isApproved:true, isActive:true });
    const done   = logs.filter(l => l.workingMs > 0);
    const avg    = done.length ? done.reduce((s,l) => s+l.workingMs,0) / done.length : 0;
    res.json({
      stats: { total, active, online, leave, afk, offline:active-online-leave-afk, present:logs.length, eodCount, avgHours:fmtMs(avg), pendingApproval },
      todayLogs: logs,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin:false }).select('-password').sort({ isApproved:1, name:1 });
    const logs  = await AttendanceLog.find({ date:today() });
    const map   = {}; logs.forEach(l => { map[l.user.toString()] = l; });
    res.json({ users: users.map(u => ({ ...u.toJSON(), todayLog: map[u._id.toString()]||null })) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin:false, isApproved:false }).select('-password').sort({ createdAt:-1 });
    res.json({ users });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isApproved = true; user.isActive = true;
    user.approvedBy = req.user._id; user.approvedAt = new Date();
    await user.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const nodemailer  = require('nodemailer');
        const transporter = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS } });
        await transporter.sendMail({
          from: `"SkilliTrack" <${process.env.EMAIL_USER}>`,
          to:   user.email,
          subject: '✅ Your SkilliTrack account has been approved!',
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #E2E8F0"><h2 style="color:#0F172A">Account Approved! ✅</h2><p style="color:#475569">Hi ${user.name}, your SkilliTrack account has been approved. You can now login!</p><div style="background:#F8FAFC;border-radius:8px;padding:14px;margin-top:16px;border:1px solid #E2E8F0"><div style="font-size:12px;color:#64748B">Login email</div><div style="font-size:15px;font-weight:600;color:#0F172A">${user.email}</div></div></div>`,
        });
      } catch(e) { console.log('Approval email failed:', e.message); }
    }
    res.json({ user, message: 'Approved!' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rejected and removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── User detail with full AFK history ──
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Not found' });

    const [logs, eods] = await Promise.all([
      AttendanceLog.find({ user: user._id }).sort({ date: -1 }).limit(90),
      EOD.find({ user: user._id }).sort({ date: -1 }).limit(90),
    ]);

    const totalMs    = logs.reduce((s,l) => s+(l.workingMs||0), 0);
    const totalAfkMs = logs.reduce((s,l) => s+(l.totalAfkMs||0), 0);
    const present    = logs.filter(l => l.status==='present').length;

    res.json({
      user, logs, eods,
      stats: {
        present,
        leave:       logs.filter(l => l.status==='leave').length,
        hours:       fmtMs(totalMs),
        netHours:    fmtMs(totalMs - totalAfkMs),
        totalAfkMs:  fmtMs(totalAfkMs),
        eods:        eods.length,
        avgMs:       present > 0 ? Math.floor(totalMs/present) : 0,
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role, color, isActive, isAdmin, isApproved } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (name       != null) user.name       = name;
    if (role       != null) user.role       = role;
    if (color      != null) user.color      = color;
    if (isActive   != null) user.isActive   = isActive;
    if (isAdmin    != null) user.isAdmin    = isAdmin;
    if (isApproved != null) user.isApproved = isApproved;
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
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.overrideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online','offline','leave','afk'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.attendance = async (req, res) => {
  try {
    const { from, to, userId } = req.query;
    const q = {};
    if (from||to) { q.date={}; if(from) q.date.$gte=from; if(to) q.date.$lte=to; }
    if (userId) q.user = userId;
    const logs = await AttendanceLog.find(q)
      .populate('user','name role color')
      .sort({ date:-1 }).limit(500);
    res.json({ logs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.allEODs = async (req, res) => {
  try {
    const { date, userId } = req.query;
    const q = {};
    if (date)   q.date = date;
    if (userId) q.user = userId;
    const eods = await EOD.find(q).populate('user','name role color').sort({ date:-1 }).limit(500);
    res.json({ eods });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Min 6 characters' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};