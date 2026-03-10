import NavBar from "../Components/NavBar";
import styles from "./Landing.module.css";

export default function Landing({ onNavigate }) {
  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button
            className={styles.navBtn}
            onClick={() => onNavigate("login")}
          >
            Iniciar Sesión
          </button>
        }
      />

      <main className={styles.hero}>

        {/* Ícono grande */}
        <div className={styles.icon}>🎧</div>

        {/* Títulos */}
        <h1 className={styles.titleLight}>Bienvenido a</h1>
        <h1 className={styles.titleBold}>EduAudio IA</h1>

        {/* Descripción */}
        <p className={styles.description}>
          Optimiza tu estudio convirtiendo archivos{" "}
          <strong>PDF y Word</strong>{" "}
          en audios inteligentes con IA.
        </p>

        {/* Botón principal */}
        <button
          className={styles.ctaBtn}
          onClick={() => onNavigate("signup")}
        >
          Comenzar ahora
        </button>

        {/* Badges de formatos */}
        <div className={styles.badges}>
          <span className={styles.badge}>📄 PDF</span>
          <span className={styles.badge}>📝 Word</span>
        </div>

      </main>

      <footer className={styles.footer}>
        © 2026 EduAudio IA – Proyecto de Tecnología en Software
      </footer>

    </div>
  );
}