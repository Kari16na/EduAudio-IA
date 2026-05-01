import { useState, useEffect, useRef } from "react";
import NavBar from "../Components/NavBar";
import styles from "./Player.module.css";

export default function Player({ onNavigate }) {

  const audio = JSON.parse(localStorage.getItem("currentAudio") || "{}");
  const PARAGRAPHS = audio.paragraphs?.length > 0
    ? audio.paragraphs
    : ["No hay contenido disponible."];

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [slow,        setSlow]        = useState(false);
  const audioRef = useRef(null);

  const totalPalabras = PARAGRAPHS.reduce((acc, p) => acc + p.split(' ').length, 0);
  const palabraGlobal = duration > 0
    ? Math.floor((currentTime / duration) * totalPalabras)
    : 0;

  // ✅ Corregido: sin let contador
  const PARRAFOS_PROCESADOS = PARAGRAPHS.map((parrafo, i) => {
    const palabras = parrafo.split(' ');
    const inicio = PARAGRAPHS
      .slice(0, i)
      .reduce((acc, p) => acc + p.split(' ').length, 0);
    return { palabras, inicio };
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = slow ? 0.75 : 1;
    }
  }, [slow]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const updateTime = () => setCurrentTime(audioEl.currentTime);
    const updateDur  = () => setDuration(audioEl.duration);
    audioEl.addEventListener('timeupdate',     updateTime);
    audioEl.addEventListener('loadedmetadata', updateDur);
    return () => {
      audioEl.removeEventListener('timeupdate',     updateTime);
      audioEl.removeEventListener('loadedmetadata', updateDur);
    };
  }, []);

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
    <div className={styles.page}>

      <audio
        ref={audioRef}
        src={audio.audioUrl}
        onEnded={() => setIsPlaying(false)}
      />

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button className={styles.btnBack} onClick={() => onNavigate("audios")}>
            ← Mis Audios
          </button>
        }
      />

      <main className={styles.main}>

        <div className={styles.titleBox}>
          <h2 className={styles.title}>
            🎧 {audio.fileName || "Documento"}
          </h2>
        </div>

        <div className={styles.textBox}>
          {PARRAFOS_PROCESADOS.map((item, pIndex) => (
            <p key={pIndex} className={styles.parrafo}>
              {item.palabras.map((palabra, wIndex) => {
                const indiceGlobal = item.inicio + wIndex;
                const esActiva = indiceGlobal === palabraGlobal && isPlaying;
                return (
                  <span
                    key={wIndex}
                    className={esActiva ? styles.palabraActiva : styles.palabra}
                  >
                    {palabra}{" "}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        <div className={styles.progressSection}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div className={styles.progressBar} onClick={handleProgressClick}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>

        <div className={styles.controls}>
          <button className={styles.btnSkip} onClick={() => skip(-10)}>
            ⏮ 10s
          </button>
          <button className={styles.btnPlay} onClick={togglePlay}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className={styles.btnSkip} onClick={() => skip(10)}>
            10s ⏭
          </button>
        </div>

        <div className={styles.speedSection}>
          <span className={styles.speedLabel}>Velocidad:</span>
          <div className={styles.speedButtons}>
            <button
              className={!slow ? styles.speedBtnActive : styles.speedBtn}
              onClick={() => setSlow(false)}
            >
              Normal
            </button>
            <button
              className={slow ? styles.speedBtnActive : styles.speedBtn}
              onClick={() => setSlow(true)}
            >
              Lento
            </button>
          </div>
        </div>

        <div className={styles.downloadSection}>
          <a
            href={audio.audioUrl}
            download={`${audio.fileName || "audio"}.mp3`}
            className={styles.btnDownload}
          >
            ⬇ Descargar MP3
          </a>
        </div>

      </main>
    </div>
  );
}