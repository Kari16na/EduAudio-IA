require('dotenv').config();
const fs = require('fs');
const path = require('path');
const gTTS = require('gtts');

function parsearYLimpiar(texto) {
  if (!texto) {
    return { textoAudio: '', parrafos: [] };
  }

  const limpio = String(texto)
    .replace(/\s+/g, ' ')
    .trim();

  const parrafos = limpio
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 20);

  return {
    textoAudio: limpio,
    parrafos,
  };
}

async function resumirConGemini(texto, idioma = 'es', categoria = 'general') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return texto;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Resume este texto en ${idioma === 'en' ? 'inglés' : 'español'} para una categoría ${categoria}. Mantén la idea principal y favorece un formato claro y útil para audio educativo.\n\n${String(texto).slice(0, 15000)}`
          }]
        }]
      })
    });

    const data = await response.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || texto;
  } catch (error) {
    console.error('Error con Gemini:', error.message);
    return texto;
  }
}

function generarArchivoAudioMp3({ textoAudio, idioma = 'es', userId, fileName }) {
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

      const baseUrl = process.env.PUBLIC_BASE_URL || 'https://eduaudio-ia-production.up.railway.app';
      resolve(`${baseUrl}/audio/${path.basename(filePath)}`);
    });
  });
}

module.exports = {
  parsearYLimpiar,
  resumirConGemini,
  generarArchivoAudioMp3,
};
