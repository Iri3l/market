const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'market-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

app.get('/', (_req, res) => {
  res.type('html').send(`
    <h1>MARKET API</h1>
    <p>Server running. Helpful endpoints:</p>
    <ul>
      <li><a href="/health">/health</a></li>
      <li><a href="/api/listings">/api/listings</a> (GET)</li>
    </ul>
  `);
});

module.exports = app;
