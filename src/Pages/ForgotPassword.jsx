import { useState } from "react";
import FormCard from "../Components/FormCard";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword({ onNavigate }) {

  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);

  function handleSend() {
    if (!email.trim()) return;
    setSent(true);
  }

  // Vista 2: éxito
  if (sent) {
    return (
      <FormCard onNavigate={onNavigate}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✅</div>
          <h2 className={styles.title}>¡Correo enviado!</h2>
          <p className={styles.successText}>
            Enviamos un enlace de recuperación a:
          </p>
          <p className={styles.emailShown}>{email}</p>
          <p className={styles.successNote}>
            Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={() => onNavigate("login")}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </FormCard>
    );
  }

  // Vista 1: formulario
  return (
    <FormCard onNavigate={onNavigate}>

      <div className={styles.header}>
        <div className={styles.headerIcon}>🔒</div>
        <h2 className={styles.title}>¿Olvidaste tu contraseña?</h2>
        <p className={styles.subtitle}>
          Ingresa tu correo electrónico y te enviaremos
          un enlace para restablecerla.
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Correo Electrónico:</label>
        <input
          className={styles.input}
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button
        className={styles.btnPrimary}
        onClick={handleSend}
        disabled={!email.trim()}
      >
        Enviar enlace
      </button>

      <div className={styles.backLink}>
        <button
          className={styles.btnLink}
          onClick={() => onNavigate("login")}
        >
          Volver al inicio de sesión
        </button>
      </div>

    </FormCard>
  );
}