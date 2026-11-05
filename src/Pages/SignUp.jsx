import { useState, useRef, useEffect } from "react";
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";
import FormCard from "../Components/FormCard";
import { API_URL } from "../config";
import styles from "./SignUp.module.css";

export default function SignUp({ onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState(null);

  // Estado para mostrar u ocultar la contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ventana de Términos y Condiciones
  const [showTerms, setShowTerms] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const termsBodyRef = useRef(null);

  // Si el texto cabe sin desplazarse (pantallas grandes), se habilita de una vez
  useEffect(() => {
    if (showTerms && termsBodyRef.current) {
      const el = termsBodyRef.current;
      if (el.scrollHeight <= el.clientHeight + 5) setCanAccept(true);
    }
  }, [showTerms]);

  function openTerms(e) {
    e.preventDefault();
    setCanAccept(false);
    setShowTerms(true);
  }

  // Al marcar el checkbox se abren los términos; el check solo queda marcado al aceptarlos
  function handleTermsCheck(e) {
    if (e.target.checked) {
      setCanAccept(false);
      setShowTerms(true);
    } else {
      setAcceptTerms(false);
    }
  }

  // Habilita "Aceptar" cuando el usuario llega al final del texto
  function handleTermsScroll(e) {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setCanAccept(true);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido (debe contener @).");
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
      setError("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      onNavigate("login");
    } catch {
      setError("Error al conectar con el servidor.");
    }
  }

  function getPasswordLevel() {
    if (password.length === 0) return 0;
    if (password.length < 8) return 1; // Débil
    if (password.length <= 11) return 2; // Media
    return 3; // Fuerte (12 caracteres)
  }

  const passwordLevel = getPasswordLevel();
  const levelLabels = ["", "Débil", "Media", "Fuerte"];
  const levelClasses = ["", styles.level1, styles.level2, styles.level3];
  const textClasses = ["", styles.textLevel1, styles.textLevel2, styles.textLevel3];

  return (
    <FormCard onNavigate={onNavigate}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <UserPlus size={40} />
        </div>
        <h2 className={styles.title}>Crea tu cuenta</h2>
        <p className={styles.subtitle}>
          Únete a la comunidad de estudio inteligente
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Ingrese su nombre:</label>
        <input
          className={styles.input}
          type="text"
          data-testid="signup-name"
          placeholder="Ej: Karina Romero"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Correo Electrónico:</label>
        <input
          className={styles.input}
          type="email"
          data-testid="signup-email"
          placeholder="correo@ejemplo.com"
          maxLength={100}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Contraseña con icono de ojo */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Contraseña:</label>
        <div className={styles.passwordContainer}>
          <input
            className={styles.inputPassword}
            type={showPassword ? "text" : "password"}
            data-testid="signup-password"
            placeholder="Mínimo 8 caracteres"
            maxLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {password.length > 0 && (
          <div className={styles.strengthWrapper}>
            <div className={styles.strengthBars}>
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`${styles.strengthBar} ${
                    level <= passwordLevel ? levelClasses[passwordLevel] : ""
                  }`}
                />
              ))}
            </div>
            <span className={`${styles.strengthLabel} ${textClasses[passwordLevel]}`}>
              {levelLabels[passwordLevel]}
            </span>
          </div>
        )}
      </div>

      {/* Confirmar contraseña con icono de ojo */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Confirmar Contraseña:</label>
        <div className={styles.passwordContainer}>
          <input
            className={`${styles.inputPassword} ${
              confirmPassword.length > 0 && password !== confirmPassword
                ? styles.inputError
                : ""
            }`}
            type={showConfirmPassword ? "text" : "password"}
            data-testid="signup-confirm-password"
            placeholder="Repite tu contraseña"
            maxLength={12}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className={styles.fieldError}>Las contraseñas no coinciden</p>
        )}
        {confirmPassword.length > 0 && password === confirmPassword && (
          <p className={styles.fieldSuccess}>
            <CheckCircle size={14} /> Las contraseñas coinciden
          </p>
        )}
      </div>

      <div className={styles.checkboxGroup}>
        <input
          type="checkbox"
          id="terms"
          data-testid="signup-terms"
          checked={acceptTerms}
          onChange={handleTermsCheck}
          className={styles.checkbox}
        />
        <label htmlFor="terms" className={styles.checkboxLabel}>
          Acepto los{" "}
          <button
            type="button"
            className={styles.termsLink}
            data-testid="signup-terms-link"
            onClick={openTerms}
          >
            Términos y Condiciones
          </button>
        </label>
      </div>

      {error && (
        <div className={styles.error} data-testid="signup-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <button
        className={styles.btnPrimary}
        data-testid="signup-submit"
        onClick={handleRegister}
      >
        Crear cuenta
      </button>

      <p className={styles.loginLink}>
        ¿Ya tienes cuenta?{" "}
        <button className={styles.btnLink} onClick={() => onNavigate("login")}>
          Inicia sesión
        </button>
      </p>

      {/* Ventana de Términos y Condiciones */}
      {showTerms && (
        <div className={styles.modalOverlay} onClick={() => setShowTerms(false)}>
          <div
            className={styles.modal}
            data-testid="terms-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Términos y Condiciones</h3>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Cerrar"
                onClick={() => setShowTerms(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={styles.modalBody}
              ref={termsBodyRef}
              onScroll={handleTermsScroll}
              data-testid="terms-body"
            >
              <p>Última actualización: noviembre de 2026.</p>

              <p>
                EduAudio IA convierte archivos PDF y Word (.docx) de hasta 10 MB
                en resúmenes y audios para estudiar. Al crear una cuenta, eres
                responsable de mantener segura tu contraseña y del uso de tu cuenta.
              </p>

              <p>
                Conservas los derechos sobre tus documentos. Al subir uno,
                confirmas que tienes permiso para usarlo y autorizas a EduAudio IA
                a procesarlo únicamente para generar el resumen y el audio. No
                subas contenido ilegal ni archivos que infrinjan derechos de otras
                personas.
              </p>

              <p>
                El archivo original se procesa para extraer su texto. El resumen y
                el audio se guardan en tu cuenta hasta que los elimines. Puedes
                borrar los audios desde “Mis Audios”.
              </p>

              <p>
                Los resultados se generan con inteligencia artificial y pueden
                contener errores u omisiones. Revísalos con el documento original.
                Los audios están pensados para uso personal y de estudio; para
                otros usos, debes tener los derechos necesarios.
              </p>

              <p>
                El servicio es gratuito actualmente. Para conocer cómo se procesan
                tus datos y documentos, consulta nuestra Política de Privacidad.
              </p>

              <p>Al aceptar, confirmas que leíste y aceptas estos términos.</p>
            </div>

            {!canAccept && (
              <p className={styles.modalHint}>
                Desplázate hasta el final para poder aceptar.
              </p>
            )}

            <button
              type="button"
              className={styles.modalAccept}
              data-testid="terms-accept-btn"
              disabled={!canAccept}
              onClick={() => {
                setAcceptTerms(true);
                setShowTerms(false);
              }}
            >
              Aceptar y cerrar
            </button>
          </div>
        </div>
      )}
    </FormCard>
  );
}
