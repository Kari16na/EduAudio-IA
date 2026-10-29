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
 * No toca los guiones dentro de palabras (ej. "back-end").
 */
function limpiarParaVoz(t) {
  return String(t || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#>`~]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\s+\n/g, '\n');
}

/**
 * Limpia y prepara la salida de la IA para guardarla y convertirla en voz
 */
function parsearYLimpiar(resumen) {
  const texto = limpiarParaVoz(String(resumen || '').replace(/\r/g, '')).trim();

  if (!texto) {
    return { textoAudio: '', parrafos: [] };
  }

  const limpio = texto
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const parrafos = limpio
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const textoAudio = parrafos.join(' ').slice(0, MAX_CHARS_AUDIO);

  return { textoAudio, parrafos };
}

/**
 * Detecta una tabla de contenido (varias líneas con puntos seguidos de número de página)
 * y devuelve el texto que viene después de ella.
 */
function quitarTablaContenido(texto) {
  const ventana = texto.slice(0, 25000);
  const re = /\.{4,}\s*\d*/g;
  let m;
  let prevEnd = -1;
  let lastEnd = -1;
  let count = 0;

  while ((m = re.exec(ventana)) !== null) {
    // Si la separación con el punteado anterior es grande, el índice ya terminó
    if (prevEnd !== -1 && m.index - prevEnd > 800) break;
    prevEnd = m.index + m[0].length;
    lastEnd = prevEnd;
    count += 1;
  }

  if (count >= 5 && lastEnd > 0) {
    return texto.slice(lastEnd);
  }
  return texto;
}

/**
 * Filtro para eliminar portada, tabla de contenido, encabezados institucionales y basura del PDF
 */
function prepararTextoLargo(textoCrudo, maxChars = 60000) {
  let texto = String(textoCrudo || '').replace(/\r/g, '').trim();
  if (!texto) return '';

  // 1. Quita portada + tabla de contenido
  texto = quitarTablaContenido(texto);

  // 2. Basura institucional repetitiva
  texto = texto
    .replace(/Grupo de Ejecución de la Formación Virtual/gi, '')
    .replace(/\bSENA\b/g, '')
    .replace(/^\s*\d+\s*$/gm, ''); // números de página sueltos

  // 3. Puntos de índice sobrantes y espacios
  texto = texto
    .replace(/\.{4,}\s*\d*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return texto.slice(0, maxChars);
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

Ignora por completo portada, índice, tabla de contenido, números de página, créditos, fechas y texto repetido. Trabaja solo con el contenido real del documento y no inventes información externa.

Estructura que debes seguir:
1. Mapa inicial: en pocas frases, di de qué trata el tema, para qué sirve y qué va a aprender el oyente. Anuncia cuántas ideas principales verá.
2. Desarrollo: explica cada idea principal en orden lógico, de lo general a lo particular. Por cada idea: primero la definición en lenguaje simple, luego el porqué y para qué sirve, luego un ejemplo concreto o una analogía de la vida real basada en el texto, y termina con una frase que resuma la idea.
3. Conexiones: relaciona cada idea con las anteriores para que el oyente vea el tema como un todo, no como datos sueltos. Señala diferencias entre conceptos que se confunden fácilmente.
4. Práctica activa: antes del cierre, formula 3 preguntas de comprensión sobre lo más importante. Después de cada pregunta di "piensa tu respuesta" y luego da la respuesta correcta con una breve explicación.
5. Repaso final: repite las ideas esenciales en pocas frases claras y cierra con una idea memorable que resuma todo.

Reglas de estilo (será leído por un sintetizador de voz):
- Un solo narrador, tono claro, cercano y profesional.
- Frases cortas y fáciles de seguir al oído. Explica cualquier término técnico la primera vez que aparezca.
- Redacta solo en párrafos hablados. Prohibido usar viñetas, guiones, asteriscos, numeraciones, títulos, tablas o símbolos.
- No uses saludos ni frases como "aquí tienes". Empieza directo con el mapa inicial.
- Cubre todo el documento, incluyendo la parte media y final, sin omitir conceptos importantes.

Documento:
${contenido}`;

  let apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  apiKey = apiKey.replace(/^["']|["']$/g, '');

  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY en las variables de entorno.');
  }

  const modelo = (process.env.GEMINI_MODEL || 'gemini-3.7-flash').trim();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

  try {
    const response = await axios.post(
      endpoint,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 16000, // margen amplio: el razonamiento interno también cuenta
        },
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

  if (!process.env.CLOUD_NAME || !process.env.API_KEY || !(process.env.API_SECRET || process.env.CLOUD_SECRET)) {
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
