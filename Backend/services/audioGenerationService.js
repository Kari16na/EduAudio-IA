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

/**
 * Limpia y formatea la respuesta para que el frontend la lea perfectamente en Markdown
 */
function parsearYLimpiar(resumen) {
  const texto = String(resumen || '').replace(/```json/g, '').replace(/```/g, '').trim();

  if (!texto) {
    return {
      textoAudio: '',
      parrafos: [],
    };
  }

  const parrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Texto adaptado para el reproductor de audio (sin símbolos Markdown pesados)
  const textoAudio = texto
    .replace(/[#*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 8000);

  return { textoAudio, parrafos };
}

/**
 * Filtro inteligente para saltar tablas de contenido e índices iniciales del SENA
 */
function prepararTextoLargo(textoCrudo) {
  let texto = String(textoCrudo || '').trim();
  if (texto.length < 2000) return texto;

  const inicioLower = texto.slice(0, 3000).toLowerCase();
  if (inicioLower.includes('tabla de contenido') || inicioLower.includes('índice general') || inicioLower.includes('control del documento')) {
    const matchTema = texto.search(/(introducci[oó]n|unidad\s+1|m[oó]dulo\s+1|cap[ií]tulo\s+1|\n1\.\s+[A-Z])/i);
    if (matchTema > 0 && matchTema < 8000) {
      texto = texto.slice(matchTema);
    }
  }

  return texto.slice(0, 45000);
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenidoOriginal = String(texto || '').trim();

  if (!contenidoOriginal) {
    throw new Error('No hay texto para resumir.');
  }

  const contenido = prepararTextoLargo(contenidoOriginal);
  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';
  
  // PROMPT MAESTRO DE NIVEL THEA (Estructura de Guía de Estudio Profesional)
  const prompt = `Actúa como un Diseñador Instruccional Senior y Experto en Curaduría de Contenidos Académicos. Tu misión es transformar el documento proporcionado en una **Guía de Estudio Profesional y Estructurada** (idéntica al estándar de calidad de plataformas avanzadas como Thea o NotebookLM).

Contexto:
- Idioma: ${idiomaLabel}
- Categoría: ${categoria}

Reglas estrictas de formato y contenido que DEBES seguir rigurosamente:
1. **Estructura en Markdown Limpio:** Utiliza "#" para el título principal, "##" para las secciones clave y "###" para subtemas o conceptos específicos.
2. **Eliminación Absoluta de Ruido:** Ignora por completo índices, portadas, números de página, créditos institucionales y textos repetitivos del inicio. Ve directo al contenido académico.
3. **Estructura Académica Obligatoria:**
   - **Introducción:** Explica de forma concisa de qué trata el documento y por qué es fundamental dominarlo.
   - **Desarrollo Temático por Secciones:** Organiza los conceptos clave en bloques lógicos y cronológicos. Utiliza viñetas cortas ("*") únicamente para listar características, elementos o definiciones importantes para mantener una lectura visualmente impecable.
   - **Conceptos Clave Explicados:** Desglosa los términos técnicos complejos de forma clara y con sentido práctico (explicando el qué y el porqué).
   - **Síntesis y Conclusiones:** Un cierre potente que consolide el aprendizaje definitivo.

Texto bruto a procesar:
${contenido}`;

  let apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  apiKey = apiKey.replace(/^["']|["']$/g, '');

  if (!apiKey) {
    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  }

  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const requestUrl = `${endpoint}?key=${apiKey}`;

    const response = await axios.post(
      requestUrl,
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
