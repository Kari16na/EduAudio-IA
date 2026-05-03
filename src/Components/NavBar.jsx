import Logo from "./Logo";
import styles from "./NavBar.module.css";

export default function NavBar({ onNavigate, rightContent }) {
  return (
    <nav className={styles.nav}>

      {/* Logo + nombre clickeable */}
      <button
        className={styles.brand}
        onClick={() => onNavigate("landing")}
      >
        <Logo size={48} />
        <span className={styles.brandName}>EduAudio IA</span>
      </button>

      {/* Contenido derecho variable según pantalla */}
      <div className={styles.right}>
        {rightContent}
      </div>

    </nav>
  );
}