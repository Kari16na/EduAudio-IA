const express = require('express');
const router = express.Router();
const Audio = require('../models/Audio');
const jwt = require('jsonwebtoken');

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

// Obtener audios del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const audios = await Audio.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(audios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar audio
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Audio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Audio eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;