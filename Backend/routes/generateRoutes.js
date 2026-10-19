const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { parsearYLimpiar, resumirConGemini, generarArchivoAudioMp3 } = require('../services/audioGenerationService');
const Audio = require('../models/Audio');
const authMiddleware = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isPdf = file.mimetype === 'application/pdf';
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (isPdf || isDocx || /\.(pdf|docx)$/i.test(file.originalname || '')) {
      return cb(null, true);
    }
    return cb(new Error('Solo se permiten archivos PDF o Word (.docx).'));
  },
});

router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debes subir un archivo.' });
    }

    const idioma = req.body.language === 'en' ? 'en' : 'es';
    const categoria = ['general', 'idiomas'].includes(req.body.category) ? req.body.category : 'general';
    const modo = req.body.modo === 'normal' ? 'normal' : 'resumen';

    let texto = '';
    if (req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname || '')) {
      const pdfData = await pdfParse(req.file.buffer);
      texto = pdfData.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      texto = result.value;
    }

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({ message: 'No se pudo extraer texto del documento.' });
    }

    const fileName = req.file.originalname;
    let textoAudio = texto;
    let parrafos = [texto];

    if (modo === 'resumen') {
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
      category: categoria,
    });

    await nuevoAudio.save();

    return res.status(201).json({ message: 'Audio generado exitosamente', audio: nuevoAudio });
  } catch (error) {
    console.error('Error generando audio:', error.message);
    return res.status(500).json({ message: `Error al procesar el documento: ${error.message}` });
  }
});

module.exports = router;
