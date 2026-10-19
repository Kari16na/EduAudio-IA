require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Audio = require('../models/Audio');
const authMiddleware = require('../middleware/auth');
const { parsearYLimpiar, resumirConGemini, generarArchivoAudioMp3 } = require('../services/audioGenerationService');

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
// Límite de caracteres para "Audio completo" (gTTS es lento con textos enormes)
const MAX_CHARS_AUDIO = Number(process.env.MAX_CHARS_AUDIO) || 20000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === DOCX) return cb(null, true);
    const err = new Error('Solo se permiten archivos PDF o Word (.docx).');
    err.status = 400;
    cb(err);
  }
});

// POST /api/audios/generate - Generar audio desde documento
router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debes subir un archivo' });
    }

    const idioma = req.body.language === 'en' ? 'en' : 'es';
    const categoria = ['general', 'idiomas'].includes(req.body.category) ? req.body.category : 'general';
    const modo = req.body.modo === 'normal' ? 'normal' : 'resumen';

    let texto = '';
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      texto = pdfData.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      texto = result.value;
    }

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({ message: 'No se pudo extraer texto del documento.' });
    }

    if (modo === 'normal' && texto.length > MAX_CHARS_AUDIO) {
      return res.status(400).json({
        message: `El documento es muy largo para "Audio completo" (máx. ${MAX_CHARS_AUDIO} caracteres). Usa el modo Resumen.`
      });
    }

    const fileName = req.file.originalname;
    let textoAudio, parrafos;

    if (modo === 'normal') {
      textoAudio = texto;
      parrafos = [texto];
    } else {
      const resumenCompleto = await resumirConGemini(texto, idioma, categoria);
      const parsed = parsearYLimpiar(resumenCompleto);
      textoAudio = parsed.textoAudio;
      parrafos = parsed.parrafos;
    }

    const audioUrl = await generarArchivoAudioMp3({ textoAudio, idioma, userId: req.userId, fileName });

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

    res.status(201).json({ message: 'Audio generado exitosamente', audio: nuevoAudio });
  } catch (error) {
    console.error('Error generando audio:', error.message);
    res.status(500).json({ message: 'Error al procesar el documento: ' + error.message });
  }
});

module.exports = router;