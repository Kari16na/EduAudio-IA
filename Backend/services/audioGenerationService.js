const fs = require('fs');
const path = require('path');
const axios = require('axios');
const gTTS = require('gtts');
const cloudinary = require('../config/cloudinary');

const baseUrl = process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'https://eduaudio-ia-production.up.railway.app';
const normalizedBase = String(baseUrl).replace(/\/$/, '');

function normalizePublicAudioUrl(audioUrl) {
  if (!audioUrl) return '';
  const url = String(audioUrl).trim();

  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/api/audio/')) return `${normalizedBase}/audio/${url.replace(/^\/api\/audio\//i, '')}`;
  if (url.startsWith('/audio/')) return `${normalizedBase}${url}`;
  if (url.startsWith('audio/')) return `${normalizedBase}/${url}`;

  return `${normalizedBase}/${url.replace(/^\/+/, '')}`;
}

function parsearYLimpiar(resumen) {
  const texto = String(resumen || '').replace(/```/g, '').trim();

  if (!texto) {
    return {
      textoAudio: '',
      parrafos: [],
    };
  }

  const limpio = texto
    .replace(/\r/g, '')
    .replace(/^[-*•]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+\n/g, '\n')
    .trim();

  const parrafos = limpio
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 8);

  const textoAudio = parrafos.length > 0
    ? parrafos.join(' ').slice(0, 4000)
    : limpio.slice(0, 4000);

  return { textoAudio, parrafos };
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenido = String(texto || '').trim();

  if (!contenido) {
    throw new Error('No hay texto para resumir.');
  }

  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';
  const prompt = `Eres un asistente que resume textos educativos. Responde solo con el resumen y mantén un formato claro y legible para audio.

Contexto:
- Idioma: ${idiomaLabel}
- Categoría: ${categoria}

Instrucciones:
1. Genera un resumen claro, conciso y útil para estudiar.
2. Divide en párrafos cortos para lectura en voz alta.
3. No agregues introducciones ni comentarios.
4. Si el texto tiene listas, conviértelas en ideas claras.
5. Mantén la información más importante y útil para aprender.

Texto a resumir:
${contenido}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return parsearYLimpiar(contenido).textoAudio || contenido.slice(0, 2000);
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const candidateText = response?.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      ?.join('')
      ?.trim();

    if (candidateText) {
      return candidateText;
    }

    return parsearYLimpiar(contenido).textoAudio || contenido.slice(0, 2000);
  } catch (error) {
    console.error('Error al consumir Gemini:', error?.response?.data || error.message);
    return parsearYLimpiar(contenido).textoAudio || contenido.slice(0, 2000);
  }
}

async function generarArchivoAudioMp3({ textoAudio, idioma = 'es', userId, fileName }) {
  const textToSpeak = String(textoAudio || '').slice(0, 4000);

  if (!textToSpeak.trim()) {
    throw new Error('No hay texto para generar audio.');
  }

  if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
    throw new Error('Faltan variables de Cloudinary: CLOUD_NAME, API_KEY o API_SECRET.');
  }

  const tempDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const safeName = (fileName || 'audio')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');

  const tempFile = path.join(tempDir, `${safeName}_${Date.now()}.mp3`);
  const lang = idioma === 'en' ? 'en' : 'es';

  await new Promise((resolve, reject) => {
    const gtts = new gTTS(textToSpeak, lang);
    gtts.save(tempFile, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  try {
    const result = await cloudinary.uploader.upload(tempFile, {
      folder: 'eduaudio_audios',
      resource_type: 'video',
      overwrite: true,
      format: 'mp3',
    });

    const secureUrl = result?.secure_url || result?.url;
    if (!secureUrl) {
      throw new Error('Cloudinary no devolvió una URL pública válida para el audio.');
    }

    return secureUrl;
  } catch (error) {
    console.error('Error subiendo audio a Cloudinary:', error?.message || error);
    throw error;
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

module.exports = {
  parsearYLimpiar,
  resumirConGemini,
  generarArchivoAudioMp3,
};
