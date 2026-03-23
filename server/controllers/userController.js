const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json({ users });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online','offline','leave'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const user = await User.findById(req.user._id);
    user.status = status;
    await user.save();
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
