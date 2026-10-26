const fs = require('fs');
const path = path = require('path');
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
  
  // Prompt pedagógico optimizado para formato podcast de estudio
  const prompt = `Eres un profesor experto y creador de podcasts educativos. Tu objetivo es transformar el siguiente texto en una clase explicativa y natural pensada exclusivamente para ser escuchada y memorizada fácilmente.

Contexto:
- Idioma: ${idiomaLabel}
- Categoría: ${categoria}

Estructura obligatoria que debe seguir tu explicación:
1. **Introducción (Gancho):** Comienza indicando brevemente de qué trata este tema y por qué es clave aprenderlo.
2. **Ideas Principales:** Desarrolla los puntos medulares del texto de manera ordenada y fluida, evitando saltos bruscos.
3. **Explicación Profunda y Analogías:** Traduce los conceptos más complejos o teóricos a ejemplos prácticos o analogías sencillas de la vida real para asegurar la comprensión profunda.
4. **Cierre de Repaso:** Termina con una breve síntesis o conclusión de lo aprendido para fijar el conocimiento.

Instrucciones de formato estricto:
- Redacta todo en párrafos conversacionales y fluidos, ideales para una locución en voz alta.
- No uses viñetas, guiones ni listas de código (el texto será convertido a audio).
- No agregues introducciones conversacionales de IA como "Aquí tienes tu resumen", ve directo al contenido del podcast educativo.
- Mantén la extensión adecuada para un audio claro y de gran valor educativo.

Texto a procesar:
${contenido}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return parsearYLimpiar(contenido).textoAudio || contenido.slice(0, 2000);
  }

  try {
    const response = await axios.post(
      `[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$){apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
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
