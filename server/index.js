const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth',  require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/eod',   require('./routes/eod'));
app.use('/api/admin', require('./routes/admin'));

app.get('/',           (_, res) => res.send('SkilliTrack API running'));
app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log('Server running on port ' + (process.env.PORT || 5000))
    );
  })
  .catch(err => { console.error(err); process.exit(1); });
