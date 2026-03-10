import { useState } from "react";
import FormCard from "../Components/FormCard";
import styles from "./Login.module.css";

export default function Login({ onNavigate }) {

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError(null);
    onNavigate("dashboard");
  }

  return (
    <FormCard onNavigate={onNavigate}>

      {/* Encabezado */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>🔑</div>
        <h2 className={styles.title}>Iniciar Sesión</h2>
        <p className={styles.subtitle}>
          Bienvenido de nuevo a EduAudio IA
        </p>
      </div>

      {/* Campo email */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Correo Electrónico:
        </label>
        <input
          className={styles.input}
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Campo contraseña */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Contraseña:
        </label>
        <input
          className={styles.input}
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Botón principal */}
      <button className={styles.btnPrimary} onClick={handleLogin}>
        Entrar
      </button>

      {/* Links secundarios */}
      <div className={styles.links}>
        <button
          className={styles.btnLink}
          onClick={() => onNavigate("forgot")}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <span className={styles.linkText}>
          ¿No tienes una cuenta?{" "}
          <button
            className={styles.btnLink}
            onClick={() => onNavigate("signup")}
          >
            Regístrate
          </button>
        </span>
      </div>

    </FormCard>
  );
}