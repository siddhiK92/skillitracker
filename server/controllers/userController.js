const User          = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');

const todayKey = () => new Date().toISOString().slice(0, 10);

exports.getAll = async (req, res) => {
  try {
    const users = await User.find({ isApproved: true }).select('-password').sort({ name: 1 });
    res.json({ users });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online','offline','leave','afk'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const user  = await User.findById(req.user._id);
    const today = todayKey();
    const now   = new Date();

    // ── AFK tracking in AttendanceLog ──
    const log = await AttendanceLog.findOne({ user: user._id, date: today });

    if (log) {
      if (status === 'afk') {
        // Starting AFK — open a new session
        log.afkSessions.push({ start: now, end: null, ms: 0 });
        await log.save();

      } else if (user.status === 'afk' && status !== 'afk') {
        // Ending AFK — close the last open session
        const openSession = log.afkSessions.findIndex(s => !s.end);
        if (openSession !== -1) {
          const afkMs = now.getTime() - new Date(log.afkSessions[openSession].start).getTime();
          log.afkSessions[openSession].end = now;
          log.afkSessions[openSession].ms  = afkMs > 0 ? afkMs : 0;
          log.totalAfkMs = (log.totalAfkMs || 0) + log.afkSessions[openSession].ms;
          await log.save();
        }
      }
    }

    user.status = status;
    await user.save();

    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};