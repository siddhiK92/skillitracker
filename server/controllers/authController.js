const jwt           = require('jsonwebtoken');
const User          = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');

const makeToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' });
const todayKey  = () => new Date().toISOString().slice(0, 10);

// ── Welcome email ──
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
      subject: `Welcome to SkilliTrack, ${user.name}! 🎉`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">
          <div style="background:#1E1B4B;padding:28px 32px;text-align:center">
            <h1 style="color:#fff;font-size:22px;margin:0">SkilliTrack</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px">Welcome, ${user.name}! 👋</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
              Your account has been created on SkilliTrack and is <strong>pending admin approval</strong>.
            </p>
            <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:14px;margin-bottom:20px">
              <p style="color:#92400E;font-size:13px;margin:0">⏳ Your admin will review and approve your account shortly. You will be able to login once approved.</p>
            </div>
            <div style="background:#F8FAFC;border-radius:8px;padding:16px;border:1px solid #E2E8F0">
              <div style="font-size:12px;color:#475569;margin-bottom:4px">Your login email</div>
              <div style="font-size:15px;font-weight:600;color:#0F172A">${user.email}</div>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) { console.log('Email error (non-critical):', err.message); }
}

// ── Admin notification email ──
async function sendAdminNotification(newUser) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const nodemailer  = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"SkilliTrack" <${process.env.EMAIL_USER}>`,
      to:   process.env.EMAIL_USER, // notify admin
      subject: `New User Registration — ${newUser.name} needs approval`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E8F0">
          <div style="background:#1E1B4B;padding:24px 32px">
            <h1 style="color:#fff;font-size:20px;margin:0">New Registration Request</h1>
          </div>
          <div style="padding:28px">
            <p style="color:#475569;font-size:14px;margin:0 0 16px">A new user has registered and is waiting for your approval:</p>
            <div style="background:#F8FAFC;border-radius:8px;padding:16px;border:1px solid #E2E8F0;margin-bottom:20px">
              <div style="margin-bottom:8px"><strong>Name:</strong> ${newUser.name}</div>
              <div style="margin-bottom:8px"><strong>Email:</strong> ${newUser.email}</div>
              ${newUser.phone ? `<div><strong>Phone:</strong> ${newUser.phone}</div>` : ''}
            </div>
            <p style="color:#475569;font-size:13px">Login to your admin panel to approve or reject this request.</p>
          </div>
        </div>
      `,
    });
  } catch (err) { console.log('Admin email error:', err.message); }
}

// ── Register ──
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'This email is already registered' });

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString().slice(-4);

    const user = await User.create({
      name: name.trim(),
      username,
      email:      email.toLowerCase().trim(),
      password,
      phone:      phone || '',
      isApproved: false, // pending approval
      isActive:   false, // cant login until approved
      color:      '#6366F1',
    });

    // Send emails
    sendWelcomeEmail(user);
    sendAdminNotification(user);

    // Return success but NO token — they cant login yet
    res.status(201).json({
      message: 'Registration successful! Please wait for admin approval before logging in.',
      pending: true,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Login ──
exports.login = async (req, res) => {
  try {
    const { email, password, clientTime } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Check approval
    if (!user.isApproved)
      return res.status(403).json({ message: 'Your account is pending admin approval. Please wait.' });

    if (!user.isActive)
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });

    const today = todayKey();
    const existingLog = await AttendanceLog.findOne({ user: user._id, date: today });

    let loginTime;
    if (existingLog && existingLog.loginTime) {
      loginTime = existingLog.loginTime;
    } else {
      loginTime = clientTime ? new Date(clientTime) : new Date();
    }

    user.status     = 'online';
    user.loginTime  = loginTime;
    user.logoutTime = null;
    await user.save();

    if (existingLog) {
      existingLog.status    = 'present';
      existingLog.logoutTime = null;
      await existingLog.save();
    } else {
      await AttendanceLog.create({ user: user._id, date: today, loginTime, status: 'present' });
    }

    res.json({ user, token: makeToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Logout ──
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const now   = new Date();
    const today = todayKey();
    user.status     = 'offline';
    user.logoutTime = now;
    await user.save();
    const log = await AttendanceLog.findOne({ user: user._id, date: today });
    if (log && log.loginTime) {
      const worked = now.getTime() - new Date(log.loginTime).getTime();
      log.logoutTime = now;
      log.workingMs  = worked > 0 ? worked : 0;
      await log.save();
    }
    res.json({ message: 'Logged out', user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.me = async (req, res) => res.json({ user: req.user });