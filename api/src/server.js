require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}
start();
