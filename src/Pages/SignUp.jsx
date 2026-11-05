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
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} id="terms-modal-title">
                Términos y Condiciones de Uso de EduAudio IA
              </h3>
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
              <p>Al crear una cuenta y utilizar EduAudio IA, aceptas de forma expresa y sin reservas los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, por favor abstente de utilizar la plataforma.</p>

              <h4>1. Descripción del Servicio</h4>
              <p>EduAudio IA es una plataforma tecnológica que permite a los usuarios convertir archivos de texto en formato PDF y Word (.docx) de hasta 10 MB en resúmenes de texto y archivos de audio con fines educativos y de estudio personal.</p>

              <h4>2. Cuentas de Usuario y Seguridad</h4>
              <ul>
                <li><strong>Registro:</strong> Para acceder al servicio, debes registrarte y crear una cuenta.</li>
                <li><strong>Responsabilidad:</strong> Eres el único responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</li>
                <li><strong>Notificación:</strong> Te comprometes a notificarnos de inmediato cualquier uso no autorizado o brecha de seguridad.</li>
              </ul>

              <h4>3. Propiedad Intelectual y Contenido del Usuario</h4>
              <ul>
                <li><strong>Tus Derechos:</strong> Conservas todos los derechos de propiedad intelectual sobre los documentos que subas a la plataforma.</li>
                <li><strong>Licencia de Uso:</strong> Al subir un archivo, garantizas que posees los derechos o autorizaciones necesarias sobre dicho contenido. Asimismo, otorgas a EduAudio IA una licencia limitada, gratuita y no exclusiva para procesar, extraer texto, resumir y almacenar temporalmente el archivo, únicamente con el fin de prestarte el servicio solicitado.</li>
                <li><strong>Restricciones:</strong> Queda estrictamente prohibido subir material que infrinja derechos de autor de terceros, propiedad industrial, datos personales de otros o que contenga contenido ilegal, difamatorio, obsceno o malicioso (virus/malware).</li>
              </ul>

              <h4>4. Conservación y Eliminación de Datos</h4>
              <ul>
                <li><strong>Almacenamiento:</strong> El archivo original se procesa y el texto se extrae de forma inmediata para generar los resultados.</li>
                <li><strong>Control del Usuario:</strong> El resumen y el audio generado se guardarán en tu perfil de usuario. Puedes eliminar los audios y resúmenes en cualquier momento desde la sección “Mis Audios”.</li>
                <li><strong>Política de Datos:</strong> El manejo de tu información personal se rige bajo nuestra Política de Privacidad.</li>
              </ul>

              <h4>5. Limitación de Responsabilidad y Garantías de la IA</h4>
              <ul>
                <li><strong>Uso Exclusivo:</strong> Los resúmenes y audios generados están destinados exclusivamente para uso personal y de estudio. Cualquier explotación comercial o uso público requiere que cuentes con los derechos legales sobre el contenido original.</li>
                <li><strong>Exactitud de la IA:</strong> Los resultados se generan de forma automatizada mediante modelos de Inteligencia Artificial. EduAudio IA no garantiza la exactitud, veracidad o integridad de los resúmenes y audios. El servicio se proporciona “tal cual” y puede contener errores, imprecisiones u omisiones. Es tu responsabilidad verificar los resultados contrastándolos con el documento original.</li>
                <li><strong>Exclusión de Daños:</strong> EduAudio IA no se hace responsable por pérdidas de información, fallas técnicas temporales, ni por decisiones académicas o profesionales tomadas con base en los resúmenes generados.</li>
              </ul>

              <h4>6. Gratuidad del Servicio y Modificaciones</h4>
              <ul>
                <li><strong>Costo:</strong> El acceso y uso de las herramientas de EduAudio IA se ofrece de forma totalmente gratuita para el usuario.</li>
                <li><strong>Modificación de Términos:</strong> EduAudio IA se reserva el derecho de actualizar o modificar estos términos en cualquier momento para adaptarlos a mejoras técnicas o cambios legales. El uso continuo de la plataforma tras una modificación constituye la aceptación de los nuevos términos.</li>
              </ul>

              <p><strong>Última actualización:</strong> Noviembre de 2026.</p>
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
