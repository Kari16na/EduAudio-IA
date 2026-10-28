const fs = require('fs');
const path = require('path');
const axios = require('axios');
const gTTS = require('gtts');
const cloudinary = require('../config/cloudinary');

const MAX_CHARS_AUDIO = 20000;

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

/**
 * Quita símbolos de Markdown, viñetas y numeraciones que el lector de voz pronunciaría mal.
 */
function limpiarParaVoz(t) {
  return String(t || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#>`~]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\s+\n/g, '\n');
}

function parsearYLimpiar(resumen) {
  const texto = limpiarParaVoz(String(resumen || '')).trim();

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
    .filter(Boolean);

  const textoAudio = parrafos.length > 0
    ? parrafos.join(' ').slice(0, MAX_CHARS_AUDIO)
    : limpio.slice(0, MAX_CHARS_AUDIO);

  return { textoAudio, parrafos };
}

/**
 * Limpia el texto crudo del documento (puntos de índice, espacios, saltos de línea)
 * y lo limita a un tamaño seguro.
 */
function prepararTextoLargo(textoCrudo, maxChars = 60000) {
  return String(textoCrudo || '')
    .replace(/\r/g, '')
    .replace(/\.{4,}\s*\d*/g, ' ') // puntos suspensivos del índice + número de página
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxChars);
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenidoOriginal = String(texto || '').trim();

  if (!contenidoOriginal) {
    throw new Error('No hay texto para resumir.');
  }

  const contenido = prepararTextoLargo(contenidoOriginal);
  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';

  const prompt = `Eres un profesor experto en ciencia del aprendizaje. Convierte el documento en una explicación hablada que haga que el oyente ENTIENDA y RECUERDE el contenido, escuchándolo una sola vez.

Idioma: ${idiomaLabel}. Categoría: ${categoria}.

Ignora por completo portada, índice, tabla de contenido, números de página, créditos, fechas y texto repetido. Trabaja solo con el contenido real.

Estructura que debes seguir:
1. Mapa inicial: en pocas frases, di de qué trata el tema, para qué sirve y qué va a aprender el oyente. Anuncia cuántas ideas principales verá.
2. Desarrollo: explica cada idea principal en orden lógico, de lo general a lo particular. Por cada idea: primero la definición en lenguaje simple, luego el porqué y para qué sirve, luego un ejemplo concreto o una analogía de la vida real, y termina con una frase que resuma la idea.
3. Conexiones: relaciona cada idea con las anteriores para que el oyente vea el tema como un todo, no como datos sueltos. Señala diferencias entre conceptos que se confunden fácilmente.
4. Práctica activa: antes del cierre, formula 3 preguntas de comprensión sobre lo más importante. Después de cada pregunta di "piensa tu respuesta" y luego da la respuesta correcta con una breve explicación.
5. Repaso final: repite las ideas esenciales en pocas frases claras y cierra con una idea memorable que resuma todo.

Reglas de estilo (será leído por un sintetizador de voz):
- Un solo narrador, tono claro, cercano y profesional.
- Frases cortas y fáciles de seguir al oído. Explica cualquier término técnico la primera vez que aparezca.
- Redacta solo en párrafos hablados. Prohibido usar viñetas, guiones, asteriscos, numeraciones, títulos o símbolos.
- No uses saludos ni frases como "aquí tienes". Empieza directo con el mapa inicial.
- No inventes datos que no estén en el documento. Cubre todo el documento, incluyendo la parte media y final.

Documento:
${contenido}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY en las variables de entorno.');
  }

  const geminiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  try {
    const response = await axios.post(
      geminiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8000 },
      },
      {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
      }
    );

    const candidateText = response?.data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      ?.join('')
      ?.trim();

    if (!candidateText) {
      throw new Error('Gemini no devolvió contenido.');
    }

    return candidateText;
  } catch (error) {
    console.error('Error Gemini:', error?.response?.data || error.message);
    throw new Error('No se pudo generar el resumen con IA. Intenta de nuevo.');
  }
}

async function generarArchivoAudioMp3({ textoAudio, idioma = 'es', userId, fileName }) {
  const textToSpeak = String(textoAudio || '').slice(0, MAX_CHARS_AUDIO);

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
  prepararTextoLargo,
  resumirConGemini,
  generarArchivoAudioMp3,
  normalizePublicAudioUrl,
};
