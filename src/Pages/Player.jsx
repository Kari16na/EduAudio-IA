import { useState, useEffect, useRef } from "react";
import NavBar from "../Components/NavBar";
import styles from "./Player.module.css";

// Párrafos de ejemplo que se van resaltando
const PARAGRAPHS = [
  "Este es el resumen generado por EduAudio IA del documento seleccionado.",
  "A medida que el audio avanza, el texto resaltado cambia para que sepas qué parte se está leyendo.",
  "Puedes pausar, retroceder o adelantar el audio usando los controles de abajo.",
  "También puedes cambiar la velocidad de reproducción según tu preferencia de estudio.",
  "EduAudio IA convierte tus documentos en experiencias de aprendizaje inteligentes.",
];

const TOTAL_SECONDS = 310; // 5:10 minutos

export default function Player({ onNavigate }) {

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [speed,        setSpeed]        = useState(1);
  const intervalRef = useRef(null);

  // Párrafo activo según el tiempo
  const activeParagraph = Math.floor(
    (currentTime / TOTAL_SECONDS) * PARAGRAPHS.length
  );

  // Avanza el tiempo cuando está reproduciendo
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_SECONDS) {
            setIsPlaying(false);
            return TOTAL_SECONDS;
          }
          return prev + speed;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed]);

  // Formatea segundos a MM:SS
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Clic en la barra de progreso
  function handleProgressClick(e) {
    const bar   = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - bar.left) / bar.width;
    setCurrentTime(Math.floor(ratio * TOTAL_SECONDS));
  }

  // Retroceder / adelantar 10 segundos
  function skip(seconds) {
    setCurrentTime((prev) =>
      Math.min(TOTAL_SECONDS, Math.max(0, prev + seconds))
    );
  }

  const progress = (currentTime / TOTAL_SECONDS) * 100;

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button
            className={styles.btnBack}
            onClick={() => onNavigate("audios")}
          >
            ← Mis Audios
          </button>
        }
      />

      <main className={styles.main}>

        {/* Título */}
        <div className={styles.titleBox}>
          <h2 className={styles.title}>🎧 Reproduciendo: Documento1.pdf</h2>
        </div>

        {/* Párrafos con resaltado */}
        <div className={styles.textBox}>
          {PARAGRAPHS.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === activeParagraph
                  ? styles.paragraphActive
                  : styles.paragraph
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Barra de progreso */}
        <div className={styles.progressSection}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div
            className={styles.progressBar}
            onClick={handleProgressClick}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.time}>{formatTime(TOTAL_SECONDS)}</span>
        </div>

        {/* Controles */}
        <div className={styles.controls}>

          {/* Retroceder */}
          <button
            className={styles.btnSkip}
            onClick={() => skip(-10)}
          >
            ⏮ 10s
          </button>

          {/* Play / Pause */}
          <button
            className={styles.btnPlay}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Adelantar */}
          <button
            className={styles.btnSkip}
            onClick={() => skip(10)}
          >
            10s ⏭
          </button>

        </div>

        {/* Selector de velocidad */}
        <div className={styles.speedSection}>
          <span className={styles.speedLabel}>Velocidad:</span>
          <div className={styles.speedButtons}>
            {[0.75, 1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                className={
                  speed === s
                    ? styles.speedBtnActive
                    : styles.speedBtn
                }
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};