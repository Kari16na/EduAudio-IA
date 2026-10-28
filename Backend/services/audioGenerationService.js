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

function prepararTextoLargo(textoCrudo) {
  return String(textoCrudo || '').trim();
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenidoOriginal = String(texto || '').trim();

  if (!contenidoOriginal) {
    throw new Error('No hay texto para resumir.');
  }

  const contenido = prepararTextoLargo(contenidoOriginal);
  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';
  
  const prompt = `Actúa como un locutor experto en podcasts educativos y un neuroeducador especialista en aprendizaje auditivo. Tu misión es transformar el documento proporcionado en una clase en audio altamente asimilable, sabiendo que el oyente no puede releer y necesita claridad absoluta.

Aplica estrictamente esta estructura basada en ciencia cognitiva para audio:
1. **Organizador Previo:** Abre los primeros segundos dando el mapa general: explica de qué tratará la sesión, por qué es importante y cuáles son los puntos clave que vamos a dominar.
2. **Explicación Causal (El porqué, no solo el qué):** Desarrolla los conceptos con frases cortas y directas, enfocándote en la lógica y la causa-efecto, evitando tecnicismos innecesarios o densos.
3. **Ejemplos Concretos:** Traduce de inmediato la teoría a un ejemplo de la vida real o del ámbito profesional.
4. **Repetición Inteligente de Cierre:** Antes de terminar, haz un breve repaso o resumen retomando las ideas centrales para activar la recuperación activa en la mente del oyente y fijar el conocimiento.

Contexto:
- Idioma: ${idiomaLabel}
- Categoría: ${categoria}

Reglas de formato estricto (Optimizado para síntesis de voz / gTTS):
- Utiliza frases cortas, dinámicas y un tono conversacional, cálido y fluido.
- ESTRICTAMENTE PROHIBIDO usar viñetas, guiones, asteriscos, numeraciones o símbolos. Todo debe redactarse en párrafos corridos pensados exclusivamente para ser escuchados.
- Ve directo al grano: sin saludos robóticos de IA.

Texto bruto a procesar:
${contenido}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  }

  try {
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
      if (err) { // <-- Corregido el error de sintaxis aquí
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
