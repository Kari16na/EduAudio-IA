// routes/audioRoutes.js
// Rutas CRUD de audios: listar, actualizar nombre y eliminar
// Todas las rutas están protegidas con authMiddleware

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Audio = require('../models/Audio');
const jwt = require('jsonwebtoken');

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

// PUT /api/audios/:id - Actualizar el nombre de un audio
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { fileName } = req.body;

    // Validar que se envió el nuevo nombre
    if (!fileName || fileName.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del audio es obligatorio.' });
    }

    // Verificar que el audio pertenece al usuario autenticado
    const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });
    if (!audio) {
      return res.status(404).json({ message: 'Audio no encontrado.' });
    }

    // Actualizar y retornar el documento actualizado
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

// DELETE /api/audios/:id - Eliminar un audio y su archivo MP3 del disco
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verificar que el audio pertenece al usuario autenticado
    const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });
    if (!audio) {
      return res.status(404).json({ message: 'Audio no encontrado.' });
    }

    // Eliminar el archivo MP3 del disco si existe
    const rutaArchivo = path.join(__dirname, '../public', path.basename(audio.audioUrl));
    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }

    await Audio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Audio eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;