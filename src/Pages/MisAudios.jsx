import { useState } from "react";
import NavBar from "../Components/NavBar";
import styles from "./MisAudios.module.css";

// Datos de ejemplo
const AUDIOS = [
  { id: 1, name: "Documento1.pdf",       date: "25/02/2026", icon: "📄" },
  { id: 2, name: "Apuntes_Clase.docx",   date: "24/02/2026", icon: "📝" },
  { id: 3, name: "Resumen_Historia.pdf", date: "20/02/2026", icon: "📄" },
];

export default function MisAudios({ onNavigate }) {

  const [search, setSearch] = useState("");

  const filtered = AUDIOS.filter((audio) =>
    audio.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <div className={styles.navRight}>
            <button
              className={styles.btnNav}
              onClick={() => onNavigate("dashboard")}
            >
              Subir Nuevo
            </button>
            <button
              className={styles.btnLogout}
              onClick={() => onNavigate("landing")}
            >
              Cerrar Sesión
            </button>
          </div>
        }
      />

      <main className={styles.main}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tu Biblioteca de Estudio</h1>
            <p className={styles.subtitle}>
              Aquí están tus documentos convertidos por la IA
            </p>
          </div>
          <input
            className={styles.search}
            type="text"
            placeholder="🔍 Buscar audio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No se encontraron audios.</p>
            </div>
          ) : (
            filtered.map((audio) => (
              <div key={audio.id} className={styles.audioCard}>
                <div className={styles.audioIcon}>{audio.icon}</div>
                <div className={styles.audioInfo}>
                  <p className={styles.audioName}>{audio.name}</p>
                  <p className={styles.audioDate}>Creado: {audio.date}</p>
                </div>
                <div className={styles.audioActions}>
                  <button
                    className={styles.btnPlay}
                    onClick={() => onNavigate("player")}
                  >
                    ▶ Escuchar
                  </button>
                  <button className={styles.btnDownload}>
                    ⬇ Descargar MP3
                  </button>
                  <button className={styles.btnDelete}>🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}