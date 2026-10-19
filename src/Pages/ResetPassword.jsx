import { useState } from "react";
import FormCard from "../Components/FormCard";
import styles from "./ResetPassword.module.css";

export default function ResetPassword({ onNavigate }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Completa ambos campos.");
      setSuccess("");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo restablecer la contraseña.");
      }

      setSuccess("Contraseña actualizada correctamente.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        if (onNavigate) onNavigate("login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormCard onNavigate={onNavigate}>
      <div className={styles.header}>
        <h2 className={styles.title}>Restablecer contraseña</h2>
        <p className={styles.subtitle}>Crea una nueva contraseña para tu cuenta.</p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nueva contraseña</label>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tu nueva contraseña"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Confirmar contraseña</label>
        <input
          className={styles.input}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <button
        className={styles.btnPrimary}
        onClick={handleReset}
        disabled={loading}
      >
        {loading ? "Cargando..." : "Guardar contraseña"}
      </button>
    </FormCard>
  );
}
