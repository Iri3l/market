const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, phone, location } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, displayName, phone, location });
    return res.status(201).json({ id: user._id, email: user.email });
  } catch {
    return res.status(500).json({ error: 'register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({}, process.env.JWT_SECRET || 'dev-secret', {
      subject: user._id.toString(),
      expiresIn: '7d'
    });
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: 'login failed' });
  }
});

module.exports = router;
