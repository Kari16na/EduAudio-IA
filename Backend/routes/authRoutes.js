require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes     = require('./routes/userRoutes');
const audioRoutes    = require('./routes/audioRoutes');
const generateRoutes = require('./routes/generateRoutes');
const authRoutes     = require('./routes/authRoutes');

const app = express();

const requiredEnv = ['MONGODB_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.warn('Faltan variables de entorno:', missingEnv.join(', '));
}

const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .concat(['http://localhost:5173', 'http://localhost:3000']);

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

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 });
});

app.use('/api/audios/generate', generateRoutes);
app.use('/api/audios',          audioRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/auth',            authRoutes);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en puerto ${PORT}`));
