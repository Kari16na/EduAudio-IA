require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes     = require('./routes/userRoutes');
const audioRoutes    = require('./routes/audioRoutes');
const generateRoutes = require('./routes/generateRoutes');
const youtubeRoutes  = require('./routes/youtubeRoutes');
const authRoutes     = require('./routes/authRoutes');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/api/users',                  userRoutes);
app.use('/api/audios',                 audioRoutes);
app.use('/api/audios/generate',        generateRoutes);
app.use('/api/audios/generate-youtube', youtubeRoutes);
app.use('/api/auth',                   authRoutes);

mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error al conectar:', err));

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});