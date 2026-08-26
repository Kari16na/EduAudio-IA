const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const Audio = require('../models/Audio');

// Instrucciones extra según el tipo de contenido (categoría), en el idioma
// de salida elegido, para que el estilo de la explicación se ajuste al tema
const ESTILOS = {
  es: {
    general: '',
    idiomas: ' Ten en cuenta que el documento trata sobre el aprendizaje de un idioma (gramática, vocabulario, pronunciación o expresiones). Pon especial énfasis en explicar las reglas gramaticales con ejemplos de uso cotidiano, repite de forma natural las palabras o expresiones clave dentro de la explicación para reforzar la memoria auditiva, y compara con el español cuando ayude a entender una diferencia importante.',
    programacion: ' Ten en cuenta que el documento trata sobre programación. Conecta siempre el "qué hace" el código con el "para qué sirve" en la vida real, usando analogías cotidianas. No leas el código símbolo por símbolo: descríbelo en palabras claras (por ejemplo, en vez de leer "function sumar(a, b) { return a + b }", di algo como "una función llamada sumar, que recibe dos números y devuelve el resultado de sumarlos"). Aun así, menciona explícitamente los nombres de los términos técnicos importantes (como función, variable, bucle, condicional) para que el oyente se familiarice con el vocabulario real, incluso solo escuchando.'
  },
  en: {
    general: '',
    idiomas: ' Keep in mind that the document is about language learning (grammar, vocabulary, pronunciation, or expressions). Place special emphasis on explaining grammar rules with everyday usage examples, naturally repeat key expressions or words within the explanation to reinforce auditory memory, and compare with Spanish when it helps clarify an important difference.',
    programacion: ' Keep in mind that the document is about programming. Always connect "what the code does" with "what it\'s useful for in real life", using everyday analogies. Do not read the code symbol by symbol: describe it in clear words (for example, instead of reading "function add(a, b) { return a + b }", say something like "a function called add, that takes two numbers and returns their sum"). Still, explicitly mention important technical terms (like function, variable, loop, conditional) so the listener becomes familiar with real vocabulary, even just by listening.'
  }
};

// Textos del prompt según el idioma seleccionado (es | en) y la categoría
// del contenido (general | idiomas | programacion)
function getPrompts(idioma, categoria = 'general') {
  const estiloExtra = ESTILOS[idioma]?.[categoria] || '';

  if (idioma === 'en') {
    return {
      sistema: `You are an expert teacher explaining content out loud to a student, clearly, completely, and easy to understand by listening only (no visuals). The source content may be written/spoken in Spanish, English, or any other language — regardless of its original language, you must respond ONLY with the requested explanation, no greetings, no introductions, no extra text before or after, and no markdown (no asterisks, no # numbering, no dashes). Write your entire response in English.${estiloExtra}`,
      usuario: (texto) => `Explain the following content as if it were a spoken class, extensive and well developed (approximately 900 to 1400 words total). Do not make a list of isolated points: develop the ideas in depth, give context, explain the "why" and "how" of the important concepts, use examples when helpful, and connect each topic to the next using natural spoken transitions (for example "now that we understand this, let's see...", "this is important because...", "related to what we just covered...").

Organize the explanation into several thematic paragraphs (each covering a coherent topic or section of the content), but make it feel like a continuous narration rather than isolated points. At the end of each thematic paragraph, close with a short sentence summarizing the central idea of that paragraph in one clear, memorable sentence, before moving to the next topic. Write in plain text, with no numbering, no asterisks, no bold, in a natural spoken tone. Separate each thematic paragraph ONLY with the symbol |||, with no other text before the first paragraph or after the last one.

Content:
${texto}`
    };
  }

  return {
    sistema: `Eres un profesor experto que explica contenido en voz alta a un estudiante, de forma clara, completa y fácil de entender solo escuchando (sin ver texto ni imágenes). El contenido original puede estar en español, inglés o cualquier otro idioma; sin importar su idioma original, debes responder ÚNICAMENTE con la explicación solicitada, sin introducciones, sin saludos, sin texto adicional antes o después, sin usar markdown (nada de asteriscos, numeración con #, ni guiones). Escribe toda tu respuesta en español.${estiloExtra}`,
    usuario: (texto) => `Explica el siguiente contenido como si fuera una clase hablada, extensa y bien desarrollada (aproximadamente 900 a 1400 palabras en total). No hagas una lista de puntos sueltos: desarrolla las ideas con profundidad, da contexto, explica el "por qué" y el "cómo" de los conceptos importantes, usa ejemplos cuando ayuden a entender, y conecta cada tema con el siguiente usando transiciones naturales de una explicación hablada (por ejemplo "ahora que entendemos esto, veamos...", "esto es importante porque...", "en relación con lo anterior...").

Organiza la explicación en varios párrafos temáticos (cada uno cubriendo un tema o sección coherente del contenido), pero que se sientan como una narración continua y no como puntos aislados. Al final de cada párrafo temático, cierra con una frase corta que resuma la idea central de ese párrafo en una sola oración clara y memorable, antes de pasar al siguiente tema (esto ayuda a que el oyente consolide cada bloque antes de avanzar). Escribe en texto plano, sin numeración, sin asteriscos, sin negritas, en un tono natural de alguien explicando en voz alta. Separa cada párrafo temático ÚNICAMENTE con el símbolo |||, sin ningún otro texto antes del primer párrafo ni después del último.

Contenido:
${texto}`
  };
}

// Textos del prompt cuando se le manda a Gemini un AUDIO directamente
// (en vez de texto extraído de un documento), como en el modo "Explicación
// con IA" de YouTube. No incluye un texto a resumir, porque el contenido
// llega como archivo de audio adjunto.
function getPromptsAudio(idioma, categoria = 'general') {
  const estiloExtra = ESTILOS[idioma]?.[categoria] || '';

  if (idioma === 'en') {
    return {
      sistema: `You are an expert teacher explaining content out loud to a student, clearly, completely, and easy to understand by listening only (no visuals). You will receive an audio recording (which may be spoken in Spanish, English, or any other language) instead of text — listen to it carefully and base your explanation on what is actually said in it. Respond ONLY with the requested explanation, no greetings, no introductions, no extra text before or after, and no markdown (no asterisks, no # numbering, no dashes). Write your entire response in English.${estiloExtra}`,
      usuario: `Listen to the attached audio recording and explain its content as if it were a spoken class, extensive and well developed (approximately 900 to 1400 words total). Do not make a list of isolated points: develop the ideas in depth, give context, explain the "why" and "how" of the important concepts, use examples when helpful, and connect each topic to the next using natural spoken transitions (for example "now that we understand this, let's see...", "this is important because...", "related to what we just covered...").

Organize the explanation into several thematic paragraphs (each covering a coherent topic or section of the audio), but make it feel like a continuous narration rather than isolated points. At the end of each thematic paragraph, close with a short sentence summarizing the central idea of that paragraph in one clear, memorable sentence, before moving to the next topic. Write in plain text, with no numbering, no asterisks, no bold, in a natural spoken tone. Separate each thematic paragraph ONLY with the symbol |||, with no other text before the first paragraph or after the last one.`
    };
  }

  return {
    sistema: `Eres un profesor experto que explica contenido en voz alta a un estudiante, de forma clara, completa y fácil de entender solo escuchando (sin ver texto ni imágenes). Vas a recibir una grabación de audio (que puede estar en español, inglés o cualquier otro idioma) en lugar de texto; escúchala con atención y basa tu explicación en lo que realmente se dice ahí. Responde ÚNICAMENTE con la explicación solicitada, sin introducciones, sin saludos, sin texto adicional antes o después, sin usar markdown (nada de asteriscos, numeración con #, ni guiones). Escribe toda tu respuesta en español.${estiloExtra}`,
    usuario: `Escucha la grabación de audio adjunta y explica su contenido como si fuera una clase hablada, extensa y bien desarrollada (aproximadamente 900 a 1400 palabras en total). No hagas una lista de puntos sueltos: desarrolla las ideas con profundidad, da contexto, explica el "por qué" y el "cómo" de los conceptos importantes, usa ejemplos cuando ayuden a entender, y conecta cada tema con el siguiente usando transiciones naturales de una explicación hablada (por ejemplo "ahora que entendemos esto, veamos...", "esto es importante porque...", "en relación con lo anterior...").

Organiza la explicación en varios párrafos temáticos (cada uno cubriendo un tema o sección coherente del audio), pero que se sientan como una narración continua y no como puntos aislados. Al final de cada párrafo temático, cierra con una frase corta que resuma la idea central de ese párrafo en una sola oración clara y memorable, antes de pasar al siguiente tema. Escribe en texto plano, sin numeración, sin asteriscos, sin negritas, en un tono natural de alguien explicando en voz alta. Separa cada párrafo temático ÚNICAMENTE con el símbolo |||, sin ningún otro texto antes del primer párrafo ni después del último.`
  };
}

// Pausa la ejecución la cantidad de milisegundos indicada
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sube un archivo de audio a Gemini (protocolo de subida "resumable" de
// Google), espera a que termine de procesarlo, y le pide que lo escuche
// y genere una explicación hablada. Se usa para el modo "Explicación con
// IA" de YouTube, cuando el video no tiene subtítulos.
async function resumirAudioConGemini(audioPath, mimeType, idioma, categoria) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fileBuffer = fs.readFileSync(audioPath);
  const fileSize = fileBuffer.length;

  // 1. Iniciar la subida
  const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileSize),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { display_name: 'audio-youtube' } })
  });

  if (!startRes.ok) {
    throw new Error(`Error iniciando subida a Gemini (${startRes.status}): ${await startRes.text()}`);
  }

  const uploadUrl = startRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Gemini no devolvió una URL de subida.');
  }

  // 2. Subir los bytes del archivo de audio
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(fileSize),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    body: fileBuffer
  });

  if (!uploadRes.ok) {
    throw new Error(`Error subiendo el audio a Gemini (${uploadRes.status}): ${await uploadRes.text()}`);
  }

  const uploadData = await uploadRes.json();
  let fileInfo = uploadData.file;

  // 3. Esperar a que Gemini termine de procesar el archivo (puede tardar
  // unos segundos, especialmente en audios largos)
  let intentosEspera = 0;
  while (fileInfo.state === 'PROCESSING' && intentosEspera < 20) {
    await esperar(2000);
    const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileInfo.name}?key=${apiKey}`);
    fileInfo = await checkRes.json();
    intentosEspera++;
  }

  if (fileInfo.state !== 'ACTIVE') {
    throw new Error('Gemini no pudo terminar de procesar el archivo de audio. Intenta con un video más corto.');
  }

  // 4. Pedirle a Gemini que escuche el audio y genere la explicación
  const { sistema, usuario } = getPromptsAudio(idioma, categoria);
  const modelo = 'gemini-3.5-flash-lite';

  const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: sistema }] },
      contents: [{
        role: 'user',
        parts: [
          { text: usuario },
          { file_data: { mime_type: mimeType, file_uri: fileInfo.uri } }
        ]
      }]
    })
  });

  if (!genRes.ok) {
    throw new Error(`Error de Gemini API (${genRes.status}): ${await genRes.text()}`);
  }

  const data = await genRes.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!texto) {
    throw new Error('Gemini no devolvió contenido de texto a partir del audio.');
  }

  return texto;
}

// Convierte la respuesta cruda de Gemini (separada por |||) en un arreglo
// de párrafos limpios, y arma el texto final que se convertirá en audio
function parsearYLimpiar(resumenCompleto) {
  let parrafos = resumenCompleto
    .split('|||')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (parrafos.length <= 1) {
    parrafos = resumenCompleto
      .split('\n')
      .map(p => p
        .replace(/^\d+\.\s*/, '')
        .replace(/\*+/g, '')
        .replace(/^-\s*/, '')
        .trim()
      )
      .filter(p => p.length > 0);
  }

  const textoAudio = parrafos
    .join('. ')
    .replace(/\*+/g, '')
    .replace(/#/g, '')
    .replace(/_/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { parrafos, textoAudio };
}

// Genera el archivo mp3 final con gTTS a partir de un texto ya resumido,
// borrando el audio anterior del mismo nombre si existía. Se usa tanto
// para documentos como para el modo "Explicación con IA" de YouTube.
async function generarArchivoAudioMp3({ textoAudio, idioma, userId, fileName }) {
  const publicPath = path.join(__dirname, '../public');
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
  }

  const audioExistente = await Audio.findOne({ userId, fileName });
  if (audioExistente) {
    const rutaAnterior = path.join(publicPath, path.basename(audioExistente.audioUrl));
    if (fs.existsSync(rutaAnterior)) {
      fs.unlinkSync(rutaAnterior);
    }
    await Audio.findByIdAndDelete(audioExistente._id);
  }

  const audioFileName = `audio_${Date.now()}.mp3`;
  const audioPath = path.join(publicPath, audioFileName);
  const gttsLang = idioma === 'en' ? 'en' : 'es';

  await new Promise((resolve, reject) => {
    const gtts = new gTTS(textoAudio, gttsLang);
    gtts.save(audioPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return audioFileName;
}

// Llama a la API de Gemini (Google AI Studio) usando fetch nativo de Node.
// Reintenta automáticamente si Gemini responde que está saturado (error 503).
async function resumirConGemini(texto, idioma, categoria, intento = 1) {
  const MAX_INTENTOS = 3;
  const apiKey = process.env.GEMINI_API_KEY;
  const modelo = 'gemini-3.5-flash-lite';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

  const { sistema, usuario } = getPrompts(idioma, categoria);

  const body = {
    system_instruction: {
      parts: [{ text: sistema }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: usuario(texto) }]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 503 && intento < MAX_INTENTOS) {
      const esperaMs = intento * 3000;
      console.log(`Gemini saturado (503). Reintentando en ${esperaMs / 1000}s... (intento ${intento + 1}/${MAX_INTENTOS})`);
      await esperar(esperaMs);
      return resumirConGemini(texto, idioma, categoria, intento + 1);
    }

    const errorBody = await response.text();
    throw new Error(`Error de Gemini API (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoRespuesta) {
    throw new Error('Gemini no devolvió contenido de texto.');
  }

  return textoRespuesta;
}

// Toma un texto crudo (extraído de un PDF/Word), lo resume con Gemini,
// genera el audio con gTTS, y devuelve los datos para guardarlo en MongoDB.
async function generarAudioDesdeTexto({ texto, idioma, categoria, userId, fileName }) {
  const resumenCompleto = await resumirConGemini(texto, idioma, categoria);
  const { parrafos, textoAudio } = parsearYLimpiar(resumenCompleto);
  const audioFileName = await generarArchivoAudioMp3({ textoAudio, idioma, userId, fileName });

  return { audioFileName, textoAudio, parrafos };
}

module.exports = {
  getPrompts,
  resumirConGemini,
  resumirAudioConGemini,
  parsearYLimpiar,
  generarArchivoAudioMp3,
  generarAudioDesdeTexto
};