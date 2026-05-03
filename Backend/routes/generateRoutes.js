require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');
const Audio = require('../models/Audio');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

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

router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
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
      return res.status(400).json({ message: 'No se pudo extraer texto del documento.' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Eres un asistente de estudio experto en hacer resúmenes cortos y claros.
          Tu tarea es resumir el siguiente texto en exactamente 5 puntos clave.
          Reglas ESTRICTAS:
          - Cada punto máximo 2 oraciones cortas y simples
          - Usa lenguaje conversacional, como si le explicaras a un amigo
          - Solo incluye la información más importante
          - Separa cada punto con el símbolo |||
          - NO escribas títulos, números ni viñetas
          - NO copies frases literales del texto original
          
          Texto: ${texto.substring(0, 5000)}`
        }
      ],
      model: 'llama-3.1-8b-instant',
    });

    const resumenCompleto = completion.choices[0].message.content;

    const parrafos = resumenCompleto
      .split('|||')
      .map(p => p.trim())
      .filter(p => p.length > 0);
      
    // Limpiar asteriscos y caracteres especiales
const textoAudio = parrafos
  .join('. ')
  .replace(/\*+/g, '')
  .replace(/#/g, '')
  .replace(/_/g, '')
  .replace(/\s+/g, ' ')
  .trim();

    // Crear carpeta public si no existe
    if (!fs.existsSync(path.join(__dirname, '../public'))) {
      fs.mkdirSync(path.join(__dirname, '../public'));
    }

    // Eliminar audio anterior del mismo archivo si existe
    const audioExistente = await Audio.findOne({
      userId: req.userId,
      fileName: req.file.originalname
    });

    if (audioExistente) {
      // Borrar archivo de audio anterior del disco
      const rutaAnterior = path.join(__dirname, '../public',
        path.basename(audioExistente.audioUrl));
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }
      await Audio.findByIdAndDelete(audioExistente._id);
    }

    // Generar nuevo audio
    const audioFileName = `audio_${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, '../public', audioFileName);

    await new Promise((resolve, reject) => {
      const gtts = new gTTS(textoAudio, 'es');
      gtts.save(audioPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const audioUrl = `http://localhost:3000/public/${audioFileName}`;

    const nuevoAudio = new Audio({
      userId: req.userId,
      fileName: req.file.originalname,
      summary: textoAudio,
      audioUrl: audioUrl,
      paragraphs: parrafos
    });

    await nuevoAudio.save();

    res.status(201).json({
      message: 'Audio generado exitosamente',
      audio: nuevoAudio
    });

  } catch (error) {
    console.error('Error generando audio:', error.message);
    res.status(500).json({ message: 'Error al procesar el documento: ' + error.message });
  }
});

module.exports = router;