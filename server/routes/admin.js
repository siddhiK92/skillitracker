const r = require('express').Router();
const c = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

r.use(protect, isAdmin);

r.get('/overview',               c.overview);
r.get('/users',                  c.getUsers);
r.get('/users/pending',          c.getPendingUsers);
r.get('/users/:id',              c.getUserDetail);
r.patch('/users/:id',            c.updateUser);
r.delete('/users/:id',           c.deleteUser);
r.patch('/users/:id/approve',    c.approveUser);
r.patch('/users/:id/reject',     c.rejectUser);
r.patch('/users/:id/status',     c.overrideStatus);
r.patch('/users/:id/reset-pass', c.resetPassword);
r.get('/attendance',             c.attendance);
r.get('/eod',                    c.allEODs);

module.exports = r;