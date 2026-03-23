const r = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
r.get('/',          protect, c.getAll);
r.patch('/status',  protect, c.updateStatus);
module.exports = r;
