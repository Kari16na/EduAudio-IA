const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const Audio = require('../models/Audio');
const cloudinary = require('../config/cloudinary'); // 👈 Importamos Cloudinary

// Instrucciones extra según el tipo de contenido (categoría), en el idioma
const ESTILOS = {
  es: {
    general: '',
    idiomas: ' Ten en cuenta que el documento trata sobre el aprendizaje de un idioma...'
  },
  en: {
    general: '',
    idiomas: ' Keep in mind that the document is about language learning...'
  }
};

// Textos del prompt según idioma y categoría
function getPrompts(idioma, categoria = 'general') {
  const estiloExtra = ESTILOS[idioma]?.[categoria] || '';
  if (idioma === 'en') {
    return {
      sistema: `You are an expert teacher...${estiloExtra}`,
      usuario: (texto) => `Explain the following content... Content:\n${texto}`
    };
  }
  return {
    sistema: `Eres un profesor experto...${estiloExtra}`,
    usuario: (texto) => `Explica el siguiente contenido... Contenido:\n${texto}`
  };
}

// Pausa ejecución
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convierte respuesta cruda de Gemini en párrafos y texto limpio
function parsearYLimpiar(resumenCompleto) {
  let parrafos = resumenCompleto
    .split('|||')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (parrafos.length <= 1) {
    parrafos = resumenCompleto
      .split('\n')
      .map(p => p.replace(/^\d+\.\s*/, '').replace(/\*+/g, '').replace(/^-\s*/, '').trim())
      .filter(p => p.length > 0);
  }

  const textoAudio = parrafos
    .join('. ')
    .replace(/\*+/g, '')
    .replace(/#/g, '')
    .replace(/_/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { parrafos, textoAudio };
}

// Genera el archivo mp3 con gTTS y lo sube a Cloudinary
async function generarArchivoAudioMp3({ textoAudio, idioma, userId, fileName }) {
  const publicPath = path.join(__dirname, '../public');
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
  }

  const audioExistente = await Audio.findOne({ userId, fileName });
  if (audioExistente) {
    const publicId = audioExistente.audioUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`eduaudio_audios/${publicId}`, { resource_type: "video" });
    await Audio.findByIdAndDelete(audioExistente._id);
  }

  const audioFileName = `audio_${Date.now()}.mp3`;
  const audioPath = path.join(publicPath, audioFileName);
  const gttsLang = idioma === 'en' ? 'en' : 'es';

  await new Promise((resolve, reject) => {
    const gtts = new gTTS(textoAudio, gttsLang);
    gtts.save(audioPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const result = await cloudinary.uploader.upload(audioPath, {
    resource_type: "video",
    folder: "eduaudio_audios"
  });

  return result.secure_url;
}

// Llama a Gemini para resumir texto
async function resumirConGemini(texto, idioma, categoria, intento = 1) {
  const MAX_INTENTOS = 3;
  const apiKey = process.env.GEMINI_API_KEY;
  const modelo = 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
  const { sistema, usuario } = getPrompts(idioma, categoria);

  const body = {
    system_instruction: { parts: [{ text: sistema }] },
    contents: [{ role: 'user', parts: [{ text: usuario(texto) }] }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 503 && intento < MAX_INTENTOS) {
      const esperaMs = intento * 3000;
      console.log(`Gemini saturado (503). Reintentando en ${esperaMs / 1000}s...`);
      await esperar(esperaMs);
      return resumirConGemini(texto, idioma, categoria, intento + 1);
    }
    throw new Error(`Error de Gemini API (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoRespuesta) throw new Error('Gemini no devolvió contenido de texto.');
  return textoRespuesta;
}

// Genera audio desde texto según modo
async function generarAudioDesdeTexto({ texto, idioma, categoria, userId, fileName, modo }) {
  let textoAudio, parrafos;

  if (modo === 'normal') {
    // Audio completo
    textoAudio = texto;
    parrafos = [texto];
  } else {
    // Resumen con Gemini
    const resumenCompleto = await resumirConGemini(texto, idioma, categoria);
    const parsed = parsearYLimpiar(resumenCompleto);
    textoAudio = parsed.textoAudio;
    parrafos = parsed.parrafos;
  }

  const audioUrl = await generarArchivoAudioMp3({ textoAudio, idioma, userId, fileName });
  return { audioUrl, textoAudio, parrafos };
}

module.exports = {
  getPrompts,
  resumirConGemini,
  parsearYLimpiar,
  generarArchivoAudioMp3,
  generarAudioDesdeTexto
};