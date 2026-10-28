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
    .filter(Boolean);

  const textoAudio = parrafos.length > 0
    ? parrafos.join(' ').slice(0, 8000)
    : limpio.slice(0, 8000);

  return { textoAudio, parrafos };
}

/**
 * Filtra el texto inicial si es un índice masivo o tabla de contenido repetitiva
 * para obligar a la IA a enfocarse en el contenido real del libro.
 */
function prepararTextoLargo(textoCrudo) {
  const texto = String(textoCrudo || '').trim();
  if (texto.length < 5000) return texto;

  const lineas = texto.split('\n');
  if (lineas.length > 100) {
    return texto;
  }
  return texto;
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenidoOriginal = String(texto || '').trim();

  if (!contenidoOriginal) {
    throw new Error('No hay texto para resumir.');
  }

  const contenido = prepararTextoLargo(contenidoOriginal);
  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';
  
  const prompt = `Eres un profesor experto y creador de podcasts educativos de alto nivel académico. Tu objetivo es analizar exhaustivamente el documento proporcionado (incluso si es extenso o un libro completo) desde la primera página hasta el final, extrayendo el contenido de valor real, los argumentos centrales y el desarrollo de los capítulos, evitando quedarte atascado en índices o portadas.

Contexto:
- Idioma: ${idiomaLabel}
- Categoría: ${categoria}

Estructura obligatoria que debe seguir tu explicación detallada:
1. **Introducción General:** Contextualiza la obra o documento completo, indicando su propósito global y los temas troncales que aborda.
2. **Desarrollo Temático Integral:** Explica de manera fluida y cronológica los conceptos clave, argumentos principales y evolución de los temas a lo largo de todo el contenido del documento, asegurando no omitir la parte media ni el cierre.
3. **Explicación Profunda y Analogías:** Traduce los conceptos más complejos o teóricos a ejemplos prácticos o analogías sencillas de la vida real para garantizar un aprendizaje profundo.
4. **Cierre de Repaso y Conclusiones:** Sintetiza los aprendizajes clave para fijar el conocimiento definitivo del documento.

Instrucciones de formato estricto:
- Redacta todo en párrafos conversacionales, profundos y fluidos, ideales para una clase magistral o locución en voz alta.
- No uses viñetas, guiones ni listas de código (el texto será convertido a audio).
- No agregues introducciones conversacionales de IA como "Aquí tienes tu resumen", ve directo al contenido del podcast educativo.
- Aprovecha al máximo la extensión para garantizar una guía y explicación rica, detallada y de alto valor educativo.

Texto a procesar:
${contenido}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  }

  try {
    // URL limpia y corregida para evitar el error de Invalid URL
    const geminiUrl = `[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$){apiKey}`;

    const response = await axios.post(
      geminiUrl,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
        },
      },
      {
        timeout: 60000,
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

    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  } catch (error) {
    console.error('Error al consumir Gemini:', error?.response?.data || error.message);
    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  }
}

async function generarArchivoAudioMp3({ textoAudio, idioma = 'es', userId, fileName }) {
  const textToSpeak = String(textoAudio || '').slice(0, 8000);

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
