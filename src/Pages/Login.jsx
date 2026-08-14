import { useState } from "react";
import { KeyRound, AlertCircle } from "lucide-react";
import FormCard from "../Components/FormCard";
import styles from "./Login.module.css";

export default function Login({ onNavigate }) {

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onNavigate("dashboard");
    } catch {
      setError("Error al conectar con el servidor.");
    }
  }

  return (
    <FormCard onNavigate={onNavigate}>

      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <KeyRound size={40} />
        </div>
        <h2 className={styles.title}>Iniciar Sesión</h2>
        <p className={styles.subtitle}>Bienvenido de nuevo a EduAudio IA</p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Correo Electrónico:</label>
        <input
          className={styles.input}
          type="email"
          data-testid="login-email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Contraseña:</label>
        <input
          className={styles.input}
          type="password"
          data-testid="login-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <div className={styles.error} data-testid="login-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <button className={styles.btnPrimary} data-testid="login-submit" onClick={handleLogin}>
        Entrar
      </button>

      <div className={styles.links}>
        <button className={styles.btnLink} onClick={() => onNavigate("forgot")}>
          ¿Olvidaste tu contraseña?
        </button>
        <span className={styles.linkText}>
          ¿No tienes una cuenta?{" "}
          <button className={styles.btnLink} onClick={() => onNavigate("signup")}>
            Regístrate
          </button>
        </span>
      </div>

    </FormCard>
  );
}