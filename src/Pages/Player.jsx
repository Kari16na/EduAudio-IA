import { useState, useEffect, useRef, useMemo } from "react";
import { Headphones, ArrowLeft, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import NavBar from "../Components/NavBar";
import { normalizeAudioUrl } from "../services/api";
import styles from "./Player.module.css";

const SYNC_OFFSET_SECONDS = 0.15;
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
  const audioData = useMemo(() => {
    try {
      const raw = localStorage.getItem("currentAudio") || "{}";
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        audioUrl: normalizeAudioUrl(parsed.audioUrl || ""),
      };
    } catch {
      return { audioUrl: "" };
    }
  }, []);

  const paragraphs = audioData.paragraphs?.length > 0 ? audioData.paragraphs : ["No hay contenido disponible."];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const rafIdRef = useRef(null);

  const { PARRAFOS_PROCESADOS, pesosAcumulados, pesoTotal } = useMemo(() => {
    let acumulado = 0;
    const acumulados = [];
    const parrafosProcesados = paragraphs.map((parrafo) => {
      const palabras = String(parrafo || "").split(/\s+/).filter(Boolean);
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
      pesoTotal: acumulado,
    };
  }, [paragraphs]);

  const adjustedTime = Math.max(0, currentTime + SYNC_OFFSET_SECONDS);

  const palabraGlobal = useMemo(() => {
    if (duration <= 0 || pesoTotal <= 0) return 0;
    const objetivo = (adjustedTime / duration) * pesoTotal;
    let lo = 0;
    let hi = pesosAcumulados.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (pesosAcumulados[mid] < objetivo) lo = mid + 1;
      else hi = mid;
    }

    return lo;
  }, [adjustedTime, duration, pesosAcumulados, pesoTotal]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const updateDur = () => setDuration(Number.isFinite(audioEl.duration) ? audioEl.duration : 0);
    audioEl.addEventListener("loadedmetadata", updateDur);
    return () => audioEl.removeEventListener("loadedmetadata", updateDur);
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !isPlaying) return;

    const tick = () => {
      setCurrentTime(audioEl.currentTime || 0);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying]);

  function formatTime(seconds) {
    if (!seconds || Number.isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleProgressClick(e) {
    const bar = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - bar.left) / bar.width;
    const newTime = ratio * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  }

  function skip(seconds) {
    if (!audioRef.current) return;
    const newTime = Math.min(duration, Math.max(0, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function togglePlay() {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
      return;
    }

    audioEl.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
      alert("No se pudo reproducir este audio.");
    });
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.page} data-testid="player-page">
      <audio
        ref={audioRef}
        src={audioData.audioUrl || ""}
        onEnded={() => setIsPlaying(false)}
        onError={() => alert("No se pudo cargar el archivo de audio.")}
        data-testid="audio-element"
      />

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button className={styles.btnBack} onClick={() => onNavigate("audios")} data-testid="btn-back-to-audios">
            <ArrowLeft size={16} /> Mis Audios
          </button>
        }
      />

      <main className={styles.main}>
        <div className={styles.titleBox}>
          <h2 className={styles.title} data-testid="player-title">
            <Headphones size={22} className={styles.icon} />
            {audioData.fileName || "Documento"}
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
          <div className={styles.progressBar} onClick={handleProgressClick} data-testid="progress-bar">
            <div className={styles.progressFill} style={{ width: `${progress}%` }} data-testid="progress-fill" />
          </div>
          <span className={styles.time} data-testid="duration-time">{formatTime(duration)}</span>
        </div>

        <div className={styles.controls} data-testid="controls">
          <button className={styles.btnSkip} onClick={() => skip(-10)} data-testid="btn-skip-back">
            <SkipBack size={16} /> 10s
          </button>

          <button className={styles.btnPlay} onClick={togglePlay} data-testid="btn-play-pause" data-playing={isPlaying}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button className={styles.btnSkip} onClick={() => skip(10)} data-testid="btn-skip-forward">
            10s <SkipForward size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
