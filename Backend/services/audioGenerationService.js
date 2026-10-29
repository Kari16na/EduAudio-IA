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
 * Limpia y prepara el texto para el almacenamiento y la síntesis de voz
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

  // Texto adaptado para el reproductor de audio (sin símbolos que entorpezcan gTTS)
  const textoAudio = texto
    .replace(/[#*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 8000);

  return { textoAudio, parrafos };
}

/**
 * Filtro inteligente para eliminar encabezados, tablas de contenido y portadas del SENA
 */
function prepararTextoLargo(textoCrudo) {
  let texto = String(textoCrudo || '').trim();
  if (texto.length < 1000) return texto;

  // Limpieza de basura institucional repetitiva
  texto = texto
    .replace(/Grupo de Ejecución de la Formación Virtual/gi, '')
    .replace(/SENA/gi, '')
    .replace(/Regional\s+[A-Za-z]+/gi, '')
    .replace(/^\s*\d+\s*$/gm, ''); // Números de página sueltos

  // Localiza el fin de la tabla de contenido para procesar directo el tema
  const lower = texto.toLowerCase();
  const indiceIndex = lower.indexOf('tabla de contenido');
  if (indiceIndex !== -1) {
    const corteReal = texto.search(/(introducci[oó]n|1\.\s+realizaci[oó]n|m[oó]dulo\s+1)/i);
    if (corteReal > indiceIndex) {
      texto = texto.slice(corteReal);
    }
  }

  return texto.slice(0, 30000);
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenidoOriginal = String(texto || '').trim();

  if (!contenidoOriginal) {
    throw new Error('No hay texto para resumir.');
  }

  const contenido = prepararTextoLargo(contenidoOriginal);
  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';
  
  // PROMPT DEFINITIVO BASADO EN APRENDIZAJE AUDITIVO (5 PASOS DE CIENCIA COGNITIVA)
  const prompt = `Actúa como un neuroeducador experto y un locutor de podcasts académicos de élite. Tu tarea es procesar el documento adjunto y transformarlo en una clase en audio basada en métodos de estudio científicamente probados para el aprendizaje auditivo (ya que el estudiante va escuchando y no puede releer).

Es obligatorio que te enfoques estrictamente en el contenido real del documento (nada de inventar información externa), organizándolo paso a paso bajo estos 5 métodos de estudio cognitivo:

1. **Organizador Previo:** Inicia la explicación ubicando al oyente en el mapa general del tema que el texto expone, indicando de qué trata y cuáles son los puntos capitales que vamos a dominar.
2. **Explicación Causal:** Desarrolla los conceptos técnicos del texto enfocándote en el "por qué" y el "para qué" de las cosas, desglosando la lógica detrás de la teoría en lugar de dar definiciones frías.
3. **Ejemplos Concretos:** Extrae o traduce los ejemplos prácticos que trae el documento (o aplica un caso de la vida real basado en el texto) para ilustrar la teoría.
4. **Recuperación Activa:** Introduce reflexiones o micro-preguntas dentro de la explicación para que la mente del estudiante active el recuerdo de lo que se acaba de explicar.
5. **Repetición Inteligente de Cierre:** Antes de terminar, haz un repaso sintetizado retomando las ideas centrales del documento para fijarlas definitivamente en la memoria.

Contexto:
- Idioma: ${idiomaLabel}
- Categoría: ${categoria}

Reglas estrictas de formato para la voz (gTTS):
- Redacta de forma fluida y conversacional, explicando el contenido del PDF como si le enseñaras a un colega.
- ESTRICTAMENTE PROHIBIDO usar viñetas, guiones, asteriscos, tablas o símbolos que arruinen la lectura de la voz artificial.
- Cíñete fielmente al documento original que se te entrega a continuación.

Texto del documento a procesar:
${contenido}`;

  let apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  apiKey = apiKey.replace(/^["']|["']$/g, '');

  if (!apiKey) {
    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  }

  try {
    // Actualizado al modelo gemini-3.5-flash (gratuito, rápido y de última generación)
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';
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
          temperature: 0.2, // Temperatura baja para mantener fidelidad estricta al documento
          maxOutputTokens: 3000,
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

  if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.CLOUD_SECRET && !process.env.API_SECRET) {
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
