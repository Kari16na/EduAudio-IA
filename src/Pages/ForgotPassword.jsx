import { useState } from "react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import FormCard from "../Components/FormCard";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword({ onNavigate }) {

  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email.trim()) return;

    if (!email.includes("@")) {
      setError("Ingresa un correo electrónico válido (debe contener @)");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Vista 2: éxito
  if (sent) {
    return (
      <FormCard onNavigate={onNavigate}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>
            <CheckCircle size={48} />
          </div>
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
        <div className={styles.headerIcon}>
          <Lock size={40} />
        </div>
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
          data-testid="forgot-email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && (
        <div className={styles.error} data-testid="forgot-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <button
        className={styles.btnPrimary}
        data-testid="forgot-submit"
        onClick={handleSend}
        disabled={!email.trim() || loading}
      >
        {loading ? "Enviando..." : "Enviar enlace"}
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