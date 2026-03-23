const jwt           = require('jsonwebtoken');
const User          = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');

const makeToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' });
const todayKey  = () => new Date().toISOString().slice(0, 10);

// ── Welcome email (optional) ──
async function sendWelcomeEmail(user) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const nodemailer  = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"SkilliTrack" <${process.env.EMAIL_USER}>`,
      to:   user.email,
      subject: `Welcome to SkilliTrack, ${user.name}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">
          <div style="background:#1E1B4B;padding:28px 32px;text-align:center">
            <h1 style="color:#fff;font-size:22px;margin:0">SkilliTrack</h1>
            <p style="color:rgba(255,255,255,0.55);margin:6px 0 0;font-size:13px">Internal Team Dashboard</p>
          </div>
          <div style="padding:32px">
            <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px">Welcome, ${user.name}!</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
              Your SkilliTrack account has been created. You can now log in and start tracking attendance and submitting EOD reports.
            </p>
            <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #E2E8F0">
              <div style="font-size:12px;color:#475569;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Your login email</div>
              <div style="font-size:15px;font-weight:600;color:#0F172A">${user.email}</div>
            </div>
            <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0">Automated message from SkilliTrack. Do not reply.</p>
          </div>
        </div>
      `,
    });
  } catch (err) { console.log('Email failed (non-critical):', err.message); }
}

// ── Register ──
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, color } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'This email is already registered' });

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString().slice(-4);
    const user = await User.create({
      name: name.trim(), username,
      email: email.toLowerCase().trim(),
      password, role: role || 'Team Member', color: color || '#6366F1',
    });

    sendWelcomeEmail(user);
    res.status(201).json({ user, token: makeToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Login ──
// FIX 1: Ek session — agar already online hai toh same loginTime rakho (naya nahi banao)
// FIX 2: loginTime client se aata hai (actual time) — server pe trust nahi
exports.login = async (req, res) => {
  try {
    const { email, password, clientTime } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive)
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });

    // FIX 1: Agar aaj pehle se login hua hai toh wahi loginTime rakho
    const today = todayKey();
    const existingLog = await AttendanceLog.findOne({ user: user._id, date: today });

    let loginTime;
    if (existingLog && existingLog.loginTime) {
      // Aaj pehle se login hua tha — wahi time use karo
      loginTime = existingLog.loginTime;
    } else {
      // Pehli baar aaj login — client time use karo ya server time
      loginTime = clientTime ? new Date(clientTime) : new Date();
    }

    user.status    = 'online';
    user.loginTime = loginTime;
    user.logoutTime = null;
    await user.save();

    // AttendanceLog update — existing ho toh sirf status update, loginTime mat badlo
    if (existingLog) {
      existingLog.status    = 'present';
      existingLog.logoutTime = null; // re-login toh logout reset karo
      await existingLog.save();
    } else {
      await AttendanceLog.create({
        user: user._id, date: today,
        loginTime, logoutTime: null, status: 'present',
      });
    }

    res.json({ user, token: makeToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Logout ──
// FIX 3: Working hours = sirf online time count karo
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now   = new Date();
    const today = todayKey();

    user.status    = 'offline';
    user.logoutTime = now;
    await user.save();

    const log = await AttendanceLog.findOne({ user: user._id, date: today });
    if (log && log.loginTime) {
      const loginMs  = new Date(log.loginTime).getTime();
      const logoutMs = now.getTime();
      // Only count if logout is after login
      const worked = logoutMs > loginMs ? logoutMs - loginMs : 0;
      log.logoutTime = now;
      log.workingMs  = worked;
      await log.save();
    }

    res.json({ message: 'Logged out', user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.me = async (req, res) => res.json({ user: req.user });