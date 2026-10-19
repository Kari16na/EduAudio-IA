require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes     = require('./routes/userRoutes');
const audioRoutes    = require('./routes/audioRoutes');
const generateRoutes = require('./routes/generateRoutes');
const authRoutes     = require('./routes/authRoutes');

const app = express();

// CORS: solo tu frontend (FRONTEND_URL en Railway). Si no está definida, permite todo (útil en local).
const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
app.use(cors({ origin: frontend || '*' }));

// Las subidas de archivos las maneja multer; el JSON normal no necesita 50mb
app.use(express.json({ limit: '1mb' }));

// Health check (Railway y JMeter)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 });
});

// OJO: /generate va ANTES que /api/audios para que no lo capture /:id
app.use('/api/audios/generate', generateRoutes);
app.use('/api/audios',          audioRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/auth',            authRoutes);

// Manejo de errores (multer, JSON inválido, etc.)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'El archivo es demasiado grande.' });
  }
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || 'Error interno' });
});

mongoose.connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err.message));

// Railway define PORT automáticamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en puerto ${PORT}`));