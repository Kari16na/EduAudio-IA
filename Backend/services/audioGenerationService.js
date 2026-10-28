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
 * Filtra y prepara texto largo para la IA
 */
function prepararTextoLargo(textoCrudo) {
  const texto = String(textoCrudo || '').trim();
  return texto;
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const contenidoOriginal = String(texto || '').trim();

  if (!contenidoOriginal) {
    throw new Error('No hay texto para resumir.');
  }

  const contenido = prepararTextoLargo(contenidoOriginal);
  const idiomaLabel = idioma === 'en' ? 'English' : 'Español';
  
  // Prompt cognitivo universal basado en ciencia del aprendizaje (Feynman y Chunking)
  const prompt = `Actúa como un Arquitecto de Información Cognitiva y un Profesor Máster en didáctica del aprendizaje acelerado. Tu misión es transformar el siguiente documento (sin importar su temática, ya sea técnica, administrativa, científica o general) en una clase magistral en audio de altísimo valor pedagógico.

Aplica estrictamente principios de ciencia cognitiva:
1. **Técnica de Feynman:** Traduce la complejidad técnica o teórica a explicaciones lógicas, claras y con sentido causal (explicando el "por qué" y el "para qué", no solo repitiendo definiciones).
2. **Estructura en Bloques (Chunking):** Organiza la información en una progresión natural de lo general a lo particular, eliminando por completo índices, portadas, metadatos, créditos institucionales y texto repetitivo.
3. **Anclaje Práctico:** Conecta los conceptos abstractos con su utilidad real o profesional en el mundo laboral.

Contexto del entorno:
- Idioma: ${idiomaLabel}
- Categoría del documento: ${categoria}

Estructura narrativa obligatoria que DEBES seguir rigurosamente en tu respuesta:
1. **Núcleo y Propósito (El Gancho):** Abre indicando de forma contundente cuál es el problema central, concepto clave o propósito fundamental que aborda el documento y por qué es crucial dominarlo.
2. **Desarrollo Conceptual y Pilares:** Explica de manera fluida, lógica y cronológica las fases, componentes, metodologías o argumentos centrales del texto. Desglosa los puntos fuertes del documento sin omitir los detalles técnicos o teóricos vitales de la parte media y final.
3. **Utilidad y Aplicación en el Mundo Real:** Explica cómo se aplican estos conocimientos en la práctica o qué impacto tienen en un entorno profesional o real.
4. **Cierre de Síntesis y Retención:** Concluye con una síntesis conceptual potente que fije el aprendizaje definitivo en la memoria a largo plazo del oyente.

Reglas de formato absoluto (Diseñado para Texto a Voz / gTTS):
- Redacta EXCLUSIVAMENTE en párrafos conversacionales densos, fluidos y de tono profesional.
- ESTRICTAMENTE PROHIBIDO usar viñetas, guiones, asteriscos, numeraciones (1, 2, 3 textuales dentro del párrafo) ni bloques de código. El texto será leído por un sintetizador de voz, por lo que todo debe fluir como un discurso hablado continuo.
- No incluyas saludos ni frases robóticas de IA como "Aquí tienes tu resumen". Comienza de inmediato con el contenido educativo.
- Maximiza la profundidad: exprime el texto provisto para dar una explicación rica, madura y completa.

Texto bruto a procesar:
${contenido}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return parsearYLimpiar(contenidoOriginal).textoAudio || contenidoOriginal.slice(0, 4000);
  }

  try {
    // URL limpia, segura y libre de caracteres o links rotos
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
