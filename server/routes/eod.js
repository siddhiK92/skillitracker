const r = require('express').Router();
const c = require('../controllers/eodController');
const { protect } = require('../middleware/auth');
r.post('/',             protect, c.submit);
r.get('/my',            protect, c.getMy);
r.get('/today',         protect, c.getToday);
r.get('/user/:id',      protect, c.getByUser);
module.exports = r;
