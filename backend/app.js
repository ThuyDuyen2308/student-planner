const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', phase: 1 });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

module.exports = app;
