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
