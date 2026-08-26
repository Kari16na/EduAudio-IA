import { useState, useEffect } from "react";
import { Bot, User, UploadCloud, FileText, File, Music, Headphones, Languages, Youtube, Volume2, Sparkles } from "lucide-react";
import NavBar from "../Components/NavBar";
import { API_URL } from "../config";
import styles from "./Dashboard.module.css";

export default function Dashboard({ onNavigate }) {

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [file,        setFile]        = useState(null);
  const [idioma,      setIdioma]      = useState("es");
  const [categoria,   setCategoria]   = useState("general");
  const [youtubeUrl,  setYoutubeUrl]  = useState("");
  const [youtubeMode, setYoutubeMode] = useState("original");
  const [loading,     setLoading]     = useState(false);
  const [totalAudios, setTotalAudios] = useState(0);

  useEffect(() => {
    async function contarAudios() {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/audios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTotalAudios(data.length);
    }
    contarAudios();
  }, []);

  function handleFile(e) {
    setFile(e.target.files[0]);
  }

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("document", file);
      formData.append("language", idioma);
      formData.append("category", categoria);
      const res = await fetch(`${API_URL}/api/audios/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      localStorage.setItem("currentAudio", JSON.stringify(data.audio));
      onNavigate("audios");
    } catch {
      alert("Error al generar el audio.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateYoutube() {
    if (!youtubeUrl.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/audios/generate-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          url: youtubeUrl,
          language: idioma,
          category: categoria,
          mode: youtubeMode
        })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      localStorage.setItem("currentAudio", JSON.stringify(data.audio));
      onNavigate("audios");
    } catch {
      alert("Error al generar el audio desde YouTube.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* Spinner de carga */}
      {loading && (
        <div className={styles.spinnerOverlay}>
          <div className={styles.spinnerCard}>
            <div className={styles.spinner} />
            <p className={styles.spinnerTitle}>
              <Bot size={20} /> Analizando documento...
            </p>
            <p className={styles.spinnerSubtitle}>
              La IA está resumiendo tu documento y generando el audio
            </p>
          </div>
        </div>
      )}

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <div className={styles.navRight}>
            <span className={styles.welcome} data-testid="dashboard-welcome">
              Bienvenido, <strong>{storedUser.fullName || "Estudiante"}</strong>
            </span>
            <button
              className={styles.btnPerfil}
              data-testid="dashboard-perfil-btn"
              onClick={() => onNavigate("perfil")}
            >
              <User size={16} /> Mi Perfil
            </button>
            <button
              className={styles.btnLogout}
              data-testid="dashboard-logout-btn"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                onNavigate("landing");
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        }
      />

      <main className={styles.main}>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <UploadCloud size={20} /> Subir Documento
          </h2>
          <p className={styles.cardSubtitle}>
            Sube tu archivo PDF o Word y la IA lo resumirá y convertirá en audio.
          </p>

          <label className={styles.label}>Idioma del resumen y el audio:</label>
          <div className={styles.languageSelector} data-testid="language-selector">
            <button
              type="button"
              className={idioma === "es" ? styles.langBtnActive : styles.langBtn}
              data-testid="lang-es-btn"
              onClick={() => setIdioma("es")}
            >
              <Languages size={16} /> Español
            </button>
            <button
              type="button"
              className={idioma === "en" ? styles.langBtnActive : styles.langBtn}
              data-testid="lang-en-btn"
              onClick={() => setIdioma("en")}
            >
              <Languages size={16} /> English
            </button>
          </div>

          <label className={styles.label}>Tipo de contenido:</label>
          <select
            className={styles.categorySelect}
            data-testid="category-select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="general">General</option>
            <option value="idiomas">Idiomas</option>
            <option value="programacion">Programación</option>
          </select>

          <label className={styles.label}>Selecciona o arrastra tu archivo:</label>

          <label className={styles.dropZone}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFile}
              className={styles.fileInput}
              data-testid="upload-file-input"
            />
            {file ? (
              <div className={styles.fileSelected}>
                <span className={styles.fileIcon}>
                  {file.name.endsWith(".pdf") ? <FileText size={32} /> : <File size={32} />}
                </span>
                <span className={styles.fileName} data-testid="upload-filename">{file.name}</span>
              </div>
            ) : (
              <div className={styles.dropContent}>
                <span className={styles.dropIcon}>
                  <UploadCloud size={36} />
                </span>
                <span className={styles.dropText}>
                  Haz clic o arrastra tu archivo aquí
                </span>
                <span className={styles.dropFormats}>PDF o Word</span>
              </div>
            )}
          </label>

          <button
            className={styles.btnGenerate}
            data-testid="upload-generate-btn"
            onClick={handleGenerate}
            disabled={!file || loading}
          >
            <Music size={18} /> Generar Audio con IA
          </button>

          <div className={styles.divider} />

          <label className={styles.label}>O pega un link de YouTube:</label>
          <input
            className={styles.youtubeInput}
            type="text"
            data-testid="youtube-url-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />

          <label className={styles.label}>¿Qué quieres obtener del video?</label>
          <div className={styles.languageSelector} data-testid="youtube-mode-selector">
            <button
              type="button"
              className={youtubeMode === "original" ? styles.langBtnActive : styles.langBtn}
              data-testid="youtube-mode-original-btn"
              onClick={() => setYoutubeMode("original")}
            >
              <Volume2 size={16} /> Audio original
            </button>
            <button
              type="button"
              className={youtubeMode === "ia" ? styles.langBtnActive : styles.langBtn}
              data-testid="youtube-mode-ia-btn"
              onClick={() => setYoutubeMode("ia")}
            >
              <Sparkles size={16} /> Explicación con IA
            </button>
          </div>

          {youtubeMode === "ia" && (
            <p className={styles.youtubeHint} data-testid="youtube-ia-hint">
              Este modo requiere que el video tenga subtítulos disponibles.
            </p>
          )}

          <button
            className={styles.btnYoutube}
            data-testid="youtube-generate-btn"
            onClick={handleGenerateYoutube}
            disabled={!youtubeUrl.trim() || loading}
          >
            <Youtube size={18} /> Generar desde YouTube
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Headphones size={20} /> Mis Audios Recientes
          </h2>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Music size={48} />
            </div>
            <p className={styles.statNumber} data-testid="dashboard-audios-count">{totalAudios}</p>
            <p className={styles.emptyText}>
              {totalAudios === 0
                ? "Aún no has convertido ningún documento."
                : `Audio${totalAudios > 1 ? "s" : ""} generado${totalAudios > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            className={styles.btnSecondary}
            data-testid="dashboard-view-library-btn"
            onClick={() => onNavigate("audios")}
          >
            Ver toda mi biblioteca
          </button>
        </section>

      </main>
    </div>
  );
}