const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const { Resend } = require('resend');
const User = require('../models/user');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

function buildFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

async function sendVerificationEmail(user) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada. Se omite el envío de verificación por email.');
    return;
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  user.verificationToken = verificationToken;
  user.verificationExpiresAt = expiresAt;
  await user.save();

  const verificationLink = `${buildFrontendUrl()}/verify-email?token=${verificationToken}`;

  const { error } = await resend.emails.send({
    from: 'EduAudio IA <onboarding@resend.dev>',
    to: [user.email],
    subject: 'Verifica tu cuenta - EduAudio IA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #4A3F8F;">🎧 EduAudio IA</h2>
        <p>Hola <strong>${user.fullName}</strong>,</p>
        <p>Gracias por crear tu cuenta.</p>
        <p>Para activar tu acceso, verifica tu correo haciendo clic en el botón de abajo:</p>
        <p>
          <a href="${verificationLink}" style="display:inline-block;background:#F5A623;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Verificar mi cuenta
          </a>
        </p>
        <p style="color:#666; font-size:13px;">Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error enviando email de verificación:', error);
    throw new Error('No se pudo enviar el correo de verificación.');
  }
}

// Configurar multer en memoria para recibir archivos de imagen del perfil
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres.' });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: emailNormalized,
      password: hashedPassword,
      isVerified: false,
    });

    try {
      await sendVerificationEmail(newUser);
    } catch (sendError) {
      console.error('Fallo al enviar verificación:', sendError.message);
      return res.status(500).json({ message: 'No se pudo enviar el correo de verificación. Inténtalo de nuevo.' });
    }

    return res.status(201).json({
      message: 'Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta.',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePhoto: newUser.profilePhoto || '',
      },
    });
  } catch (error) {
    console.error('Error registrando usuario:', error.message);
    return res.status(500).json({ message: 'Error al registrar usuario.' });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) {
      return res.status(400).json({ message: 'Token de verificación inválido.' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'El enlace de verificación es inválido o ha expirado.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpiresAt = null;
    await user.save();

    return res.json({ message: 'Correo verificado correctamente.' });
  } catch (error) {
    console.error('Error verificando email:', error.message);
    return res.status(500).json({ message: 'No se pudo verificar el correo.' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ message: 'Token de verificación inválido.' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'El enlace de verificación es inválido o ha expirado.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpiresAt = null;
    await user.save();

    return res.json({ message: 'Correo verificado correctamente.' });
  } catch (error) {
    console.error('Error verificando email:', error.message);
    return res.status(500).json({ message: 'No se pudo verificar el correo.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Verifica tu correo antes de iniciar sesión.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    return res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || '',
      },
    });
  } catch (error) {
    console.error('Error iniciando sesión:', error.message);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body || {};
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { fullName: fullName.trim() },
      { new: true }
    );

    return res.json({
      message: 'Perfil actualizado correctamente.',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto || '',
      },
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error.message);
    return res.status(500).json({ message: 'Error al actualizar perfil.' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Contraseña actual y nueva inválidas.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error.message);
    return res.status(500).json({ message: 'Error al cambiar contraseña.' });
  }
});

// Ruta flexible para aceptar archivo (FormData) o JSON con URL/Base64
router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    let photoValue = null;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'eduaudio_profiles',
        resource_type: 'image',
      });
      photoValue = uploadResponse.secure_url;
    } else {
      photoValue = req.body?.photo || req.body?.image || req.body?.profilePhoto || (typeof req.body === 'string' ? req.body : null);
    }

    if (!photoValue) {
      return res.status(400).json({ message: 'La foto es obligatoria.' });
    }

    const user = await User.findByIdAndUpdate(req.userId, { profilePhoto: photoValue }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({
      message: 'Foto de perfil actualizada.',
      photoUrl: user.profilePhoto,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || '',
      },
    });
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error.message);
    return res.status(500).json({ message: `Error al actualizar foto: ${error.message}` });
  }
});

router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    return res.json({ message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    console.error('Error eliminando cuenta:', error.message);
    return res.status(500).json({ message: 'Error al eliminar cuenta.' });
  }
});

module.exports = router;
