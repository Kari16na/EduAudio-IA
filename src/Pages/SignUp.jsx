import { useState } from "react";
import FormCard from "../Components/FormCard";
import styles from "./SignUp.module.css";

export default function SignUp({ onNavigate }) {

  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms,     setAcceptTerms]     = useState(false);
  const [error,           setError]           = useState(null);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los Términos y Condiciones.");
      return;
    }
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onNavigate("login");
    } catch {
      setError("Error al conectar con el servidor.");
    }
  }

  function getPasswordLevel() {
    if (password.length === 0) return 0;
    if (password.length < 4)   return 1;
    if (password.length < 8)   return 2;
    if (password.length < 12)  return 3;
    return 4;
  }

  const passwordLevel = getPasswordLevel();
  const levelColors   = ["", "#dc3545", "#fd7e14", "#ffc107", "#28a745"];
  const levelLabels   = ["", "Muy débil", "Débil", "Media", "Fuerte"];

  return (
    <FormCard onNavigate={onNavigate}>

      <div className={styles.header}>
        <div className={styles.headerIcon}>✍️</div>
        <h2 className={styles.title}>Crea tu cuenta</h2>
        <p className={styles.subtitle}>
          Únete a la comunidad de estudio inteligente
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nombre Completo:</label>
        <input
          className={styles.input}
          type="text"
          placeholder="Ej: Juan Pérez"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Correo Electrónico:</label>
        <input
          className={styles.input}
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Contraseña:</label>
        <input
          className={styles.input}
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {password.length > 0 && (
          <div className={styles.strengthWrapper}>
            <div className={styles.strengthBars}>
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={styles.strengthBar}
                  style={{
                    background: level <= passwordLevel
                      ? levelColors[passwordLevel]
                      : "rgba(0,0,0,0.08)",
                  }}
                />
              ))}
            </div>
            <span
              className={styles.strengthLabel}
              style={{ color: levelColors[passwordLevel] }}
            >
              {levelLabels[passwordLevel]}
            </span>
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Confirmar Contraseña:</label>
        <input
          className={`${styles.input} ${
            confirmPassword.length > 0 && password !== confirmPassword
              ? styles.inputError : ""
          }`}
          type="password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className={styles.fieldError}>Las contraseñas no coinciden</p>
        )}
        {confirmPassword.length > 0 && password === confirmPassword && (
          <p className={styles.fieldSuccess}>✅ Las contraseñas coinciden</p>
        )}
      </div>

      <div className={styles.checkboxGroup}>
        <input
          type="checkbox"
          id="terms"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor="terms" className={styles.checkboxLabel}>
          Acepto los{" "}
          <span className={styles.termsLink}>Términos y Condiciones</span>
        </label>
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <button className={styles.btnPrimary} onClick={handleRegister}>
        Crear cuenta
      </button>

      <p className={styles.loginLink}>
        ¿Ya tienes cuenta?{" "}
        <button className={styles.btnLink} onClick={() => onNavigate("login")}>
          Inicia sesión
        </button>
      </p>

    </FormCard>
  );
}