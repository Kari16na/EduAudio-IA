require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const jwt = require('jsonwebtoken');
const Audio = require('../models/Audio');
const { generarAudioDesdeTexto } = require('../services/audioGenerationService');

const upload = multer({ storage: multer.memoryStorage() });

// Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debes subir un archivo' });
    }

    const idioma = req.body.language === 'en' ? 'en' : 'es';
    const categoriasValidas = ['general', 'idiomas', 'programacion'];
    const categoria = categoriasValidas.includes(req.body.category) ? req.body.category : 'general';

    let texto = '';
    const mimetype = req.file.mimetype;

    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      texto = pdfData.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      texto = result.value;
    }

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({
        message: 'No se pudo extraer texto del documento.'
      });
    }

    const fileName = req.file.originalname;

    const { audioFileName, textoAudio, parrafos } = await generarAudioDesdeTexto({
      texto,
      idioma,
      categoria,
      userId: req.userId,
      fileName
    });

    const audioUrl = `${req.protocol}://${req.get('host')}/public/${audioFileName}`;

    const nuevoAudio = new Audio({
      userId: req.userId,
      fileName,
      summary: textoAudio,
      audioUrl,
      paragraphs: parrafos,
      language: idioma,
      category: categoria
    });

    await nuevoAudio.save();

    res.status(201).json({
      message: 'Audio generado exitosamente',
      audio: nuevoAudio
    });

  } catch (error) {
    console.error('Error generando audio:', error.message);
    res.status(500).json({
      message: 'Error al procesar el documento: ' + error.message
    });
  }
});

module.exports = router;