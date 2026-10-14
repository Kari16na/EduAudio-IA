// routes/audioRoutes.js
// Rutas CRUD de audios: listar, actualizar nombre, descargar y eliminar
// Todas las rutas están protegidas con authMiddleware

const express = require('express');
const router = express.Router();
const Audio = require('../models/Audio');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary'); // 👈 Importamos Cloudinary

// Middleware de autenticación JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

// GET /api/audios - Obtener todos los audios del usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const audios = await Audio.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(audios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/audios/download/:id - Descargar el archivo desde Cloudinary
router.get('/download/:id', async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      return res.status(404).send('Audio no encontrado en la base de datos.');
    }

    // En Cloudinary ya tienes la URL segura, así que puedes redirigir o forzar descarga
    res.redirect(audio.audioUrl); // 👈 Redirige al archivo en Cloudinary
  } catch (error) {
    res.status(500).send('Error interno al descargar el archivo.');
  }
});

// PUT /api/audios/:id - Actualizar el nombre de un audio
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName || fileName.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del audio es obligatorio.' });
    }

    const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });
    if (!audio) {
      return res.status(404).json({ message: 'Audio no encontrado.' });
    }

    const audioActualizado = await Audio.findByIdAndUpdate(
      req.params.id,
      { fileName: fileName.trim() },
      { new: true }
    );

    res.json({ message: 'Nombre actualizado correctamente.', audio: audioActualizado });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/audios/:id - Eliminar un audio de Cloudinary y de la base de datos
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });
    if (!audio) {
      return res.status(404).json({ message: 'Audio no encontrado.' });
    }

    // Extraer el public_id de Cloudinary desde la URL
    const publicId = audio.audioUrl.split('/').pop().split('.')[0];

    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(`eduaudio_audios/${publicId}`, { resource_type: "video" });

    // Eliminar de MongoDB
    await Audio.findByIdAndDelete(req.params.id);

    res.json({ message: 'Audio eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
