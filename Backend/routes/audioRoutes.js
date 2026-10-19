// Rutas CRUD de audios: listar, descargar, renombrar y eliminar.
// Todas protegidas con authMiddleware.
const express = require('express');
const router = express.Router();
const Audio = require('../models/Audio');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

// GET /api/audios - audios del usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const audios = await Audio.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(audios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// El navegador no puede mandar headers al descargar con window.location,
// así que SOLO en esta ruta se acepta el token por ?token=
function tokenDesdeQuery(req, res, next) {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

// GET /api/audios/download/:id - redirige al archivo en Cloudinary
router.get('/download/:id', tokenDesdeQuery, authMiddleware, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });
    if (!audio) return res.status(404).send('Audio no encontrado en la base de datos.');
    res.redirect(audio.audioUrl);
  } catch (error) {
    res.status(500).send('Error interno al descargar el archivo.');
  }
});

// PUT /api/audios/:id - renombrar
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName || fileName.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del audio es obligatorio.' });
    }
    const audioActualizado = await Audio.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { fileName: fileName.trim() },
      { new: true }
    );
    if (!audioActualizado) return res.status(404).json({ message: 'Audio no encontrado.' });
    res.json({ message: 'Nombre actualizado correctamente.', audio: audioActualizado });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/audios/:id - elimina de Cloudinary y de MongoDB
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });
    if (!audio) return res.status(404).json({ message: 'Audio no encontrado.' });

    const publicId = audio.audioUrl.split('/').pop().split('.')[0];
    try {
      await cloudinary.uploader.destroy(`eduaudio_audios/${publicId}`, { resource_type: 'video' });
    } catch (e) {
      // Si Cloudinary falla igual borramos el registro, para no dejarlo "atascado"
      console.error('Error borrando en Cloudinary:', e.message);
    }

    await Audio.findByIdAndDelete(audio._id);
    res.json({ message: 'Audio eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;