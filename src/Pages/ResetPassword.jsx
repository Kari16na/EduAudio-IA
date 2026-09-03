import { useState } from "react";
import FormCard from "../Components/FormCard";
import { API_URL } from "../config";
import styles from "./Login.module.css";

export default function ResetPassword({ onNavigate }) {

  const token = new URLSearchParams(window.location.search).get("token");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState(null);
  const [success,         setSuccess]         = useState(false);
  const [loading,         setLoading]         = useState(false);

  async function handleReset() {
    if (!password.trim() || !confirmPassword.trim()) {
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
    setLoading(true);
    setError(null);
    try {
      // Se reemplaza la URL de localhost por API_URL
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess(true);
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <FormCard onNavigate={onNavigate}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "#2C2C4A", marginBottom: 12 }}>
            ¡Contraseña actualizada!
          </h2>
          <p style={{ color: "#888", marginBottom: 24 }}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={() => onNavigate("login")}
          >
            Ir al inicio de sesión
          </button>
        </div>
      </FormCard>
    );
  }

  return (
    <FormCard onNavigate={onNavigate}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>🔑</div>
        <h2 className={styles.title}>Nueva contraseña</h2>
        <p className={styles.subtitle}>Ingresa tu nueva contraseña</p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nueva contraseña:</label>
        <input
          className={styles.input}
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Confirmar contraseña:</label>
        <input
          className={styles.input}
          type="password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <button
        className={styles.btnPrimary}
        onClick={handleReset}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </FormCard>
  );
}