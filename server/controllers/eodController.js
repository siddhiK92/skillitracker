const EOD = require('../models/EOD');
const today = () => new Date().toISOString().slice(0, 10);

exports.submit = async (req, res) => {
  try {
    const { projects, completed, planned, date } = req.body;
    const eod = await EOD.findOneAndUpdate(
      { user: req.user._id, date: date || today() },
      { projects, completed, planned },
      { upsert: true, new: true }
    );
    res.json({ eod });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMy = async (req, res) => {
  try {
    const eods = await EOD.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ eods });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getToday = async (req, res) => {
  try {
    const eods = await EOD.find({ date: today() }).populate('user', 'name username color role');
    res.json({ eods });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getByUser = async (req, res) => {
  try {
    const eods = await EOD.find({ user: req.params.id }).sort({ date: -1 });
    res.json({ eods });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
