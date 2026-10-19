require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const audioRoutes = require('./routes/audioRoutes');
const generateRoutes = require('./routes/generateRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .concat(['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/audio', express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 });
});

app.use('/api/audios/generate', generateRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Express error:', err && err.message ? err.message : err);
  const statusCode = err && err.status ? err.status : 500;
  res.status(statusCode).json({
    message: err && err.message ? err.message : 'Error interno del servidor.'
  });
});

const mongoUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/eduaudio';

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB conectado'))
  .catch((error) => console.error('Error al conectar a MongoDB:', error.message));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
