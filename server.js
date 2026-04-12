require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api', require('./routes/clinical'));
app.use('/api', require('./routes/main'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', system: 'Ojasya Healthcare', time: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏥 Ojasya Healthcare Backend running on port ${PORT}`);
  console.log(`📋 API docs: http://localhost:${PORT}/api/health\n`);
});
