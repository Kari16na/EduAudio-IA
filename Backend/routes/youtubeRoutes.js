require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const Audio = require('../models/Audio');
const {
  resumirAudioConGemini,
  parsearYLimpiar,
  generarArchivoAudioMp3
} = require('../services/audioGenerationService');

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

// Obtiene el ID del video a partir de links tipo:
// https://www.youtube.com/watch?v=XXXXXXXXXXX
// https://youtu.be/XXXXXXXXXXX
function extraerVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

// Borra el archivo de audio anterior del usuario con el mismo nombre, si existe
async function borrarAudioAnterior(userId, fileName, publicPath) {
  const audioExistente = await Audio.findOne({ userId, fileName });
  if (audioExistente) {
    const rutaAnterior = path.join(publicPath, path.basename(audioExistente.audioUrl));
    if (fs.existsSync(rutaAnterior)) {
      fs.unlinkSync(rutaAnterior);
    }
    await Audio.findByIdAndDelete(audioExistente._id);
  }
}

// Descarga el audio del video a la ruta indicada usando el formato elegido
function descargarAudioA(info, format, destinoPath) {
  return new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, { format });
    const writeStream = fs.createWriteStream(destinoPath);
    stream.pipe(writeStream);
    stream.on('error', reject);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

// Determina la extensión y el mime type a partir del formato elegido por ytdl
function datosDeFormato(format) {
  if (format.container === 'mp4') {
    return { extension: 'm4a', mimeType: 'audio/mp4' };
  }
  return { extension: 'webm', mimeType: 'audio/webm' };
}

router.post('/', authMiddleware, async (req, res) => {
  let audioTemporalPath = null;

  try {
    const { url, language, category, mode } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'Debes ingresar un link de YouTube.' });
    }

    const videoId = extraerVideoId(url.trim());
    if (!videoId) {
      return res.status(400).json({ message: 'El link de YouTube no es válido.' });
    }

    const idioma = language === 'en' ? 'en' : 'es';
    const categoriasValidas = ['general', 'idiomas', 'programacion'];
    const categoria = categoriasValidas.includes(category) ? category : 'general';
    const modoSeleccionado = mode === 'ia' ? 'ia' : 'original';

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    let info;
    try {
      info = await ytdl.getBasicInfo(videoUrl);
    } catch {
      return res.status(400).json({
        message: 'No se pudo acceder a este video. Verifica que el link sea correcto y que el video sea público.'
      });
    }

    const tituloVideo = info.videoDetails?.title || `Video de YouTube (${videoId})`;
    const publicPath = path.join(__dirname, '../public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath);
    }

    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
    if (!format) {
      return res.status(400).json({ message: 'No se encontró una pista de audio disponible para este video.' });
    }
    const { extension, mimeType } = datosDeFormato(format);

    // ===== MODO: AUDIO ORIGINAL (sin IA, funciona con cualquier video) =====
    if (modoSeleccionado === 'original') {
      await borrarAudioAnterior(req.userId, tituloVideo, publicPath);

      const audioFileName = `audio_${Date.now()}.${extension}`;
      const audioPath = path.join(publicPath, audioFileName);
      await descargarAudioA(info, format, audioPath);

      const audioUrl = `${req.protocol}://${req.get('host')}/public/${audioFileName}`;

      const nuevoAudio = new Audio({
        userId: req.userId,
        fileName: tituloVideo,
        summary: 'Audio original del video de YouTube (sin resumen ni explicación de IA).',
        audioUrl,
        paragraphs: [],
        language: idioma,
        category: categoria
      });

      await nuevoAudio.save();

      return res.status(201).json({
        message: 'Audio original obtenido exitosamente',
        audio: nuevoAudio
      });
    }

    // ===== MODO: EXPLICACIÓN CON IA (Gemini escucha el audio directamente,
    // no depende de que el video tenga subtítulos) =====

    // Descargar el audio a una carpeta temporal (no se sirve al usuario,
    // solo se usa para que Gemini lo escuche)
    audioTemporalPath = path.join(os.tmpdir(), `yt_temp_${Date.now()}.${extension}`);
    await descargarAudioA(info, format, audioTemporalPath);

    const resumenCompleto = await resumirAudioConGemini(audioTemporalPath, mimeType, idioma, categoria);
    const { parrafos, textoAudio } = parsearYLimpiar(resumenCompleto);

    await borrarAudioAnterior(req.userId, tituloVideo, publicPath);

    const audioFileName = await generarArchivoAudioMp3({
      textoAudio,
      idioma,
      userId: req.userId,
      fileName: tituloVideo
    });

    const audioUrl = `${req.protocol}://${req.get('host')}/public/${audioFileName}`;

    const nuevoAudio = new Audio({
      userId: req.userId,
      fileName: tituloVideo,
      summary: textoAudio,
      audioUrl,
      paragraphs: parrafos,
      language: idioma,
      category: categoria
    });

    await nuevoAudio.save();

    res.status(201).json({
      message: 'Audio generado exitosamente desde YouTube',
      audio: nuevoAudio
    });

  } catch (error) {
    console.error('Error generando audio desde YouTube:', error.message);
    res.status(500).json({
      message: 'Error al procesar el video: ' + error.message
    });
  } finally {
    // Limpiar el archivo temporal de audio, exista o no (éxito o error)
    if (audioTemporalPath && fs.existsSync(audioTemporalPath)) {
      fs.unlinkSync(audioTemporalPath);
    }
  }
});

module.exports = router;