const fs = require('fs');
const path = require('path');
const axios = require('axios');
const gTTS = require('gtts');

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
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const safeName = (fileName || 'audio')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    const filePath = path.join(outputDir, `${safeName}_${Date.now()}.mp3`);
    const textToSpeak = String(textoAudio || '').slice(0, 4000);

    if (!textToSpeak.trim()) {
      reject(new Error('No hay texto para generar audio.'));
      return;
    }

    const lang = idioma === 'en' ? 'en' : 'es';
    const gtts = new gTTS(textToSpeak, lang);

    gtts.save(filePath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(normalizePublicAudioUrl(`/audio/${path.basename(filePath)}`));
    });
  });
}

module.exports = {
  parsearYLimpiar,
  resumirConGemini,
  generarArchivoAudioMp3,
};
