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
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

async function issueVerification(user) {
  if (!resend) throw new Error('El servicio de correo no está configurado.');
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.verificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const link = `${frontendUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'EduAudio IA <onboarding@resend.dev>',
    to: [user.email],
    subject: 'Verifica tu cuenta - EduAudio IA',
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2 style="color:#4A3F8F">EduAudio IA</h2><p>Hola ${user.fullName},</p><p>Confirma tu correo para activar tu cuenta:</p><p><a href="${link}" style="display:inline-block;background:#F5A623;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Verificar mi cuenta</a></p><p>Este enlace vence en 24 horas. Si no solicitaste esta cuenta, ignora el mensaje.</p></div>`,
  });
  if (error) throw new Error('No se pudo enviar el correo de verificación.');
}

router.post('/register', async (req, res) => {
  let createdUser;
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName?.trim() || !email || !password) return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    const emailNormalized = String(email).trim().toLowerCase();
    if (!emailPattern.test(emailNormalized) || emailNormalized.length > 254) return res.status(400).json({ message: 'Ingresa un correo electrónico válido.' });
    if (password.length < 8) return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres.' });
    if (!resend) return res.status(503).json({ message: 'El servicio de verificación de correo no está configurado.' });

    let user = await User.findOne({ email: emailNormalized });
    if (user?.isVerified) return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });
    if (user) {
      user.fullName = fullName.trim();
      user.password = await bcrypt.hash(password, 10);
    } else {
      user = new User({ fullName: fullName.trim(), email: emailNormalized, password: await bcrypt.hash(password, 10), isVerified: false });
      createdUser = user;
    }
    await issueVerification(user);
    return res.status(201).json({ message: 'Cuenta pendiente de verificación. Revisa tu correo electrónico.' });
  } catch (error) {
    if (createdUser?._id) await User.findByIdAndDelete(createdUser._id).catch(() => {});
    console.error('Error registrando usuario:', error.message);
    return res.status(500).json({ message: 'No se pudo enviar el correo de verificación. Revisa la dirección e inténtalo de nuevo.' });
  }
});

async function verifyEmailToken(token) {
  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const user = await User.findOne({ verificationToken: tokenHash, verificationExpiresAt: { $gt: new Date() } });
  if (!user) return null;
  user.isVerified = true;
  user.verificationToken = null;
  user.verificationExpiresAt = null;
  await user.save();
  return user;
}

router.get('/verify-email', async (req, res) => {
  try {
    if (!req.query.token) return res.status(400).json({ message: 'Token de verificación inválido.' });
    const user = await verifyEmailToken(req.query.token);
    if (!user) return res.status(400).json({ message: 'El enlace de verificación es inválido o ha expirado.' });
    return res.json({ message: 'Correo verificado correctamente.' });
  } catch (error) {
    console.error('Error verificando correo:', error.message);
    return res.status(500).json({ message: 'No se pudo verificar el correo.' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    if (!req.body?.token) return res.status(400).json({ message: 'Token de verificación inválido.' });
    const user = await verifyEmailToken(req.body.token);
    if (!user) return res.status(400).json({ message: 'El enlace de verificación es inválido o ha expirado.' });
    return res.json({ message: 'Correo verificado correctamente.' });
  } catch (error) {
    console.error('Error verificando correo:', error.message);
    return res.status(500).json({ message: 'No se pudo verificar el correo.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Credenciales inválidas.' });
    if (!user.isVerified) return res.status(403).json({ message: 'Verifica tu correo antes de iniciar sesión.' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.json({ message: 'Inicio de sesión exitoso.', token, user: { id: user._id, fullName: user.fullName, email: user.email, profilePhoto: user.profilePhoto || '' } });
  } catch (error) {
    console.error('Error iniciando sesión:', error.message);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body || {};
    if (!fullName?.trim()) return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
    const user = await User.findByIdAndUpdate(req.userId, { fullName: fullName.trim() }, { new: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Perfil actualizado correctamente.', user: { id: user._id, fullName: user.fullName, email: user.email, profilePhoto: user.profilePhoto || '' } });
  } catch (error) {
    console.error('Error actualizando usuario:', error.message);
    return res.status(500).json({ message: 'Error al actualizar perfil.' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Contraseña actual y nueva inválidas.' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error.message);
    return res.status(500).json({ message: 'Error al cambiar contraseña.' });
  }
});

router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    let photoValue;
    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploaded = await cloudinary.uploader.upload(dataURI, { folder: 'eduaudio_profiles', resource_type: 'image' });
      photoValue = uploaded.secure_url;
    } else photoValue = req.body?.photo || req.body?.image || req.body?.profilePhoto || null;
    if (!photoValue) return res.status(400).json({ message: 'La foto es obligatoria.' });
    const user = await User.findByIdAndUpdate(req.userId, { profilePhoto: photoValue }, { new: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Foto de perfil actualizada.', photoUrl: user.profilePhoto, user: { id: user._id, fullName: user.fullName, email: user.email, profilePhoto: user.profilePhoto || '' } });
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error.message);
    return res.status(500).json({ message: 'Error al actualizar foto.' });
  }
});

router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    console.error('Error eliminando cuenta:', error.message);
    return res.status(500).json({ message: 'Error al eliminar cuenta.' });
  }
});

module.exports = router;
