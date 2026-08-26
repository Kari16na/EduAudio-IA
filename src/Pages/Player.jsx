import { useState, useEffect, useRef, useMemo } from "react";
import { Headphones, ArrowLeft, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import NavBar from "../Components/NavBar";
import styles from "./Player.module.css";

// Ajusta este valor (en segundos) para compensar el desfase entre el audio
// y el resaltado de palabras. Si el resaltado va ATRASADO respecto al audio
// (el audio "va de primeras"), sube este número. Si el resaltado se ADELANTA,
// bájalo o ponlo en negativo. Prueba de 0.1 en 0.1 hasta que se sienta natural.
const SYNC_OFFSET_SECONDS = 0.15;

// Pesos usados para estimar cuánto "tarda" cada palabra en pronunciarse,
// ya que gTTS no nos da timestamps reales por palabra. Ponderamos por
// longitud de la palabra (las palabras largas tardan más) y agregamos
// peso extra si la palabra termina en un signo de puntuación (las pausas
// después de punto, coma, etc. duran más que entre palabras normales).
const PESO_BASE_PALABRA = 3;
const PESO_POR_CARACTER = 1;
const PAUSA_COMA = 4;
const PAUSA_PUNTO = 9;

function calcularPeso(palabra) {
  let peso = PESO_BASE_PALABRA + palabra.length * PESO_POR_CARACTER;
  if (/[.!?]$/.test(palabra)) peso += PAUSA_PUNTO;
  else if (/[,;:]$/.test(palabra)) peso += PAUSA_COMA;
  return peso;
}

export default function Player({ onNavigate }) {

  const { audio, PARAGRAPHS } = useMemo(() => {
    const audioData = JSON.parse(localStorage.getItem("currentAudio") || "{}");
    const paragraphs = audioData.paragraphs?.length > 0
      ? audioData.paragraphs
      : ["No hay contenido disponible."];
    return { audio: audioData, PARAGRAPHS: paragraphs };
  }, []);

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const audioRef = useRef(null);
  const rafIdRef = useRef(null);

  const { PARRAFOS_PROCESADOS, pesosAcumulados, pesoTotal } = useMemo(() => {
    let acumulado = 0;
    const acumulados = [];
    const parrafosProcesados = PARAGRAPHS.map((parrafo) => {
      const palabras = parrafo.split(' ');
      const inicio = acumulados.length;
      palabras.forEach((palabra) => {
        acumulado += calcularPeso(palabra);
        acumulados.push(acumulado);
      });
      return { palabras, inicio };
    });
    return {
      PARRAFOS_PROCESADOS: parrafosProcesados,
      pesosAcumulados: acumulados,
      pesoTotal: acumulado
    };
  }, [PARAGRAPHS]);

  const adjustedTime = Math.max(0, currentTime + SYNC_OFFSET_SECONDS);

  const palabraGlobal = useMemo(() => {
    if (duration <= 0 || pesoTotal <= 0) return 0;
    const objetivo = (adjustedTime / duration) * pesoTotal;

    let lo = 0, hi = pesosAcumulados.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pesosAcumulados[mid] < objetivo) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, [adjustedTime, duration, pesosAcumulados, pesoTotal]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const updateDur = () => setDuration(audioEl.duration);
    audioEl.addEventListener('loadedmetadata', updateDur);
    return () => {
      audioEl.removeEventListener('loadedmetadata', updateDur);
    };
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !isPlaying) return;

    const tick = () => {
      setCurrentTime(audioEl.currentTime);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying]);

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleProgressClick(e) {
    const bar     = e.currentTarget.getBoundingClientRect();
    const ratio   = (e.clientX - bar.left) / bar.width;
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function skip(seconds) {
    const newTime = Math.min(duration, Math.max(0, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function togglePlay() {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.page} data-testid="player-page">

      <audio
        ref={audioRef}
        src={audio.audioUrl}
        onEnded={() => setIsPlaying(false)}
        data-testid="audio-element"
      />

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button
            className={styles.btnBack}
            onClick={() => onNavigate("audios")}
            data-testid="btn-back-to-audios"
          >
            <ArrowLeft size={16} /> Mis Audios
          </button>
        }
      />

      <main className={styles.main}>

        <div className={styles.titleBox}>
          <h2 className={styles.title} data-testid="player-title">
            <Headphones size={22} className={styles.icon} />
            {audio.fileName || "Documento"}
          </h2>
        </div>

        <div className={styles.textBox} data-testid="player-text-box">
          {PARRAFOS_PROCESADOS.map((item, pIndex) => (
            <p key={pIndex} className={styles.parrafo} data-testid={`parrafo-${pIndex}`}>
              {item.palabras.map((palabra, wIndex) => {
                const indiceGlobal = item.inicio + wIndex;
                const esActiva = indiceGlobal === palabraGlobal && isPlaying;
                return (
                  <span
                    key={wIndex}
                    className={esActiva ? styles.palabraActiva : styles.palabra}
                    data-testid={`palabra-${indiceGlobal}`}
                    data-active={esActiva}
                  >
                    {palabra}{" "}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        <div className={styles.progressSection} data-testid="progress-section">
          <span className={styles.time} data-testid="current-time">{formatTime(currentTime)}</span>
          <div
            className={styles.progressBar}
            onClick={handleProgressClick}
            data-testid="progress-bar"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
              data-testid="progress-fill"
            />
          </div>
          <span className={styles.time} data-testid="duration-time">{formatTime(duration)}</span>
        </div>

        <div className={styles.controls} data-testid="controls">
          <button
            className={styles.btnSkip}
            onClick={() => skip(-10)}
            data-testid="btn-skip-back"
          >
            <SkipBack size={16} /> 10s
          </button>
          <button
            className={styles.btnPlay}
            onClick={togglePlay}
            data-testid="btn-play-pause"
            data-playing={isPlaying}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            className={styles.btnSkip}
            onClick={() => skip(10)}
            data-testid="btn-skip-forward"
          >
            10s <SkipForward size={16} />
          </button>
        </div>

      </main>
    </div>
  );
}