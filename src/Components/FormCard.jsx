import NavBar from "./NavBar";
import styles from "./FormCard.module.css";

export default function FormCard({ children, onNavigate }) {
  return (
    <div className={styles.page}>

      {/* NavBar sin botones a la derecha */}
      <NavBar onNavigate={onNavigate} rightContent={null} />

      {/* Centra la tarjeta en la pantalla */}
      <div className={styles.wrapper}>
        <div className={styles.card}>
          {children}
        </div>
      </div>

    </div>
  );
}