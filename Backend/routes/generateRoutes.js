require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const jwt = require('jsonwebtoken');
const Audio = require('../models/Audio');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

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

// Llama a la API de Gemini (Google AI Studio) usando fetch nativo de Node,
// así no hace falta instalar el SDK de Google.
async function resumirConGemini(texto) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelo = 'gemini-3.5-flash-lite'; // modelo gratuito y estable (gemini-2.5-flash fue descontinuado para cuentas nuevas)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

  const promptSistema = 'Eres un profesor experto que explica documentos en voz alta a un estudiante, de forma clara, completa y fácil de entender solo escuchando (sin ver texto ni imágenes). Responde ÚNICAMENTE con la explicación solicitada, sin introducciones, sin saludos, sin texto adicional antes o después, sin usar markdown (nada de asteriscos, numeración con #, ni guiones).';

  const promptUsuario = `Explica el siguiente documento como si fuera una clase hablada, extensa y bien desarrollada (aproximadamente 900 a 1400 palabras en total). No hagas una lista de puntos sueltos: desarrolla las ideas con profundidad, da contexto, explica el "por qué" y el "cómo" de los conceptos importantes, usa ejemplos cuando ayuden a entender, y conecta cada tema con el siguiente usando transiciones naturales de una explicación hablada (por ejemplo "ahora que entendemos esto, veamos...", "esto es importante porque...", "en relación con lo anterior...").

Organiza la explicación en varios párrafos temáticos (cada uno cubriendo un tema o sección coherente del documento), pero que se sientan como una narración continua y no como puntos aislados. Al final de cada párrafo temático, cierra con una frase corta que resuma la idea central de ese párrafo en una sola oración clara y memorable, antes de pasar al siguiente tema (esto ayuda a que el oyente consolide cada bloque antes de avanzar). Escribe en texto plano, sin numeración, sin asteriscos, sin negritas, en un tono natural de alguien explicando en voz alta. Separa cada párrafo temático ÚNICAMENTE con el símbolo |||, sin ningún otro texto antes del primer párrafo ni después del último.

Texto del documento:
${texto}`;

  const body = {
    system_instruction: {
      parts: [{ text: promptSistema }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: promptUsuario }]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error de Gemini API (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoRespuesta) {
    throw new Error('Gemini no devolvió contenido de texto.');
  }

  return textoRespuesta;
}

router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    // VALIDAR ARCHIVO
    if (!req.file) {
      return res.status(400).json({ message: 'Debes subir un archivo' });
    }

    let texto = '';
    const mimetype = req.file.mimetype;

    // Extraer texto del PDF o Word
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

    // Resumir con Gemini (sin truncar: la ventana de contexto de Gemini
    // 2.5 Flash es de 1 millón de tokens, así que el documento completo cabe)
    const resumenCompleto = await resumirConGemini(texto);

    let parrafos = resumenCompleto
      .split('|||')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Si la IA no usó el separador ||| (ignoró la instrucción),
    // se limpia el texto y se divide por líneas como respaldo
    if (parrafos.length <= 1) {
      parrafos = resumenCompleto
        .split('\n')
        .map(p => p
          .replace(/^\d+\.\s*/, '')   // quita "1. ", "2. ", etc.
          .replace(/\*+/g, '')          // quita asteriscos
          .replace(/^-\s*/, '')         // quita guiones de lista
          .trim()
        )
        .filter(p => p.length > 0);
    }

    const textoAudio = parrafos
      .join('. ')
      .replace(/\*+/g, '')
      .replace(/#/g, '')
      .replace(/_/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Crear carpeta public
    const publicPath = path.join(__dirname, '../public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath);
    }

    // Eliminar audio anterior
    const audioExistente = await Audio.findOne({
      userId: req.userId,
      fileName: req.file.originalname
    });

    if (audioExistente) {
      const rutaAnterior = path.join(publicPath,
        path.basename(audioExistente.audioUrl));

      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }

      await Audio.findByIdAndDelete(audioExistente._id);
    }

    // Generar audio
    const audioFileName = `audio_${Date.now()}.mp3`;
    const audioPath = path.join(publicPath, audioFileName);

    await new Promise((resolve, reject) => {
      const gtts = new gTTS(textoAudio, 'es');
      gtts.save(audioPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const audioUrl = `${req.protocol}://${req.get('host')}/public/${audioFileName}`;

    // Guardar en MongoDB
    const nuevoAudio = new Audio({
      userId: req.userId,
      fileName: req.file.originalname,
      summary: textoAudio,
      audioUrl,
      paragraphs: parrafos
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